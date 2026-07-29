import { describe, it, expect, vi, beforeEach } from 'vitest'
import { publishDueDrafts, SCHEDULABLE_COLLECTIONS, publishAtField } from '../scheduledPublish'
import { requirePublishPermission } from '../../permissions/access'

/**
 * Scheduled publishing moves content to the public site with nobody at the
 * keyboard. The properties worth pinning: only due drafts move, the schedule is
 * cleared so an unpublish cannot be silently undone later, one failure does not
 * stall the queue, and the permission bypass works ONLY for the cron's own
 * context — never for a caller.
 */

const NOW = new Date('2026-08-02T03:30:00.000Z')

function payloadStub(dueBycollection: Record<string, { id: number; title?: string }[]> = {}) {
  return {
    find: vi.fn(async ({ collection }: { collection: string }) => ({
      docs: dueBycollection[collection] ?? [],
    })),
    update: vi.fn(async () => ({})),
  } as never
}

describe('publishDueDrafts', () => {
  it('sweeps every schedulable collection', async () => {
    const payload = payloadStub()
    await publishDueDrafts(payload, NOW)
    expect((payload as any).find).toHaveBeenCalledTimes(SCHEDULABLE_COLLECTIONS.length)
  })

  it('asks only for drafts that are due', async () => {
    const payload = payloadStub()
    await publishDueDrafts(payload, NOW)
    const where = (payload as any).find.mock.calls[0][0].where
    expect(where._status).toEqual({ equals: 'draft' })
    expect(where.publishAt).toEqual({ less_than_equal: NOW.toISOString() })
  })

  it('publishes and clears the schedule in one update', async () => {
    const payload = payloadStub({ news: [{ id: 7, title: 'Sunday message' }] })
    const result = await publishDueDrafts(payload, NOW)

    expect(result.published).toEqual([{ collection: 'news', id: 7, title: 'Sunday message' }])
    const update = (payload as any).update.mock.calls[0][0]
    expect(update.data._status).toBe('published')
    // Without this, staff unpublishing the document later would see the cron
    // silently re-publish it — the stale schedule would still be in the past.
    expect(update.data.publishAt).toBeNull()
    expect(update.context).toEqual({ scheduledPublish: true })
  })

  it('one failing document does not hold the rest of the queue hostage', async () => {
    const payload = payloadStub({ news: [{ id: 1 }, { id: 2 }] })
    ;(payload as any).update
      .mockRejectedValueOnce(new Error('validation failed'))
      .mockResolvedValueOnce({})

    const result = await publishDueDrafts(payload, NOW)
    expect(result.errors).toHaveLength(1)
    expect(result.published).toHaveLength(1)
  })

  it('a collection whose query fails is reported, not thrown', async () => {
    const payload = payloadStub()
    ;(payload as any).find.mockRejectedValueOnce(new Error('column missing'))
    const result = await publishDueDrafts(payload, NOW)
    expect(result.errors.length).toBeGreaterThan(0)
    // The remaining collections were still swept.
    expect((payload as any).find).toHaveBeenCalledTimes(SCHEDULABLE_COLLECTIONS.length)
  })
})

describe('the permission story', () => {
  const hook = requirePublishPermission('news.publish') as any
  const noPublish = { id: 1, role: 'media-editor', status: 'active' }

  it('the cron context passes without a user', () => {
    const data = { _status: 'published' }
    expect(
      hook({
        data,
        req: { user: null, context: { scheduledPublish: true } },
        originalDoc: { _status: 'draft' },
      }),
    ).toEqual(data)
  })

  it('a user without publish permission is still refused when the flag is absent', () => {
    // The flag lives in req.context, which only server-side code sets — a
    // request body or query cannot reach it. This pins that the default path
    // still enforces.
    expect(() =>
      hook({
        data: { _status: 'published' },
        req: { user: noPublish, context: {} },
        originalDoc: { _status: 'draft' },
      }),
    ).toThrow(/permission to publish/i)
  })

  it('scheduling is gated by the same permission as publishing', () => {
    // An editor who cannot publish must not be able to schedule: the cron
    // would otherwise launder a draft into print one minute later.
    const field = publishAtField('news.publish') as any
    expect(field.access.update).toBeDefined()
    expect(field.access.create).toBeDefined()
    expect(field.access.update({ req: { user: noPublish } })).toBe(false)
    expect(
      field.access.update({ req: { user: { id: 2, role: 'chancery-editor', status: 'active' } } }),
    ).toBe(true)
  })
})
