import { describe, it, expect } from 'vitest'
import { buildStructureTree, type StructureOffice } from '../structureTree'

/**
 * Staff control the parent links from the admin, so the data WILL eventually
 * contain a cycle. The property that matters most: a cycle degrades the tree,
 * it never hangs the About page.
 */

const office = (
  id: string,
  parentId: string | null = null,
  over: Partial<StructureOffice> = {},
): StructureOffice => ({
  id,
  slug: id,
  name: id.toUpperCase(),
  parentId,
  inStructure: true,
  ...over,
})

describe('the ordinary tree', () => {
  it('builds parent→children from the links', () => {
    const { roots } = buildStructureTree([
      office('eparch'),
      office('chancery', 'eparch'),
      office('tribunal', 'eparch'),
      office('archives', 'chancery'),
    ])
    expect(roots).toHaveLength(1)
    expect(roots[0]!.office.id).toBe('eparch')
    expect(roots[0]!.children.map((c) => c.office.id).sort()).toEqual(['chancery', 'tribunal'])
    expect(roots[0]!.children.find((c) => c.office.id === 'chancery')!.children[0]!.office.id).toBe('archives')
  })

  it('orders siblings by structureOrder, then name, unordered last', () => {
    const { roots } = buildStructureTree([
      office('eparch'),
      office('b-office', 'eparch', { structureOrder: 2, name: 'B' }),
      office('a-office', 'eparch', { structureOrder: 1, name: 'A' }),
      office('z-office', 'eparch', { structureOrder: null, name: 'Z' }),
    ])
    expect(roots[0]!.children.map((c) => c.office.name)).toEqual(['A', 'B', 'Z'])
  })

  it('renders multiple roots side by side', () => {
    const { roots } = buildStructureTree([office('eparch'), office('synod')])
    expect(roots.map((r) => r.office.id).sort()).toEqual(['eparch', 'synod'])
  })

  it('leaves out offices with no structure signal at all', () => {
    const { roots } = buildStructureTree([
      office('eparch'),
      office('unrelated', null, { inStructure: false }),
    ])
    expect(roots.map((r) => r.office.id)).toEqual(['eparch'])
  })

  it('treats a parent id pointing at a deleted office as rootless, not lost', () => {
    const { roots } = buildStructureTree([office('orphan', 'gone-office')])
    expect(roots.map((r) => r.office.id)).toEqual(['orphan'])
  })
})

describe('cycles — the case staff will eventually create', () => {
  it('A→B→A terminates, places both, and reports the cycle', () => {
    const result = buildStructureTree([office('a', 'b'), office('b', 'a')])
    expect(result.cycleDetected).toBe(true)
    const placed = new Set<string>()
    const walk = (nodes: typeof result.roots) =>
      nodes.forEach((n) => {
        placed.add(n.office.id)
        walk(n.children)
      })
    walk(result.roots)
    expect([...placed].sort()).toEqual(['a', 'b'])
  })

  it('a self-parent (belt to the admin validation braces) terminates', () => {
    const result = buildStructureTree([office('a', 'a')])
    expect(result.cycleDetected).toBe(true)
    expect(result.roots.map((r) => r.office.id)).toEqual(['a'])
  })

  it('a long cycle with a healthy branch keeps the branch intact', () => {
    const result = buildStructureTree([
      office('a', 'c'),
      office('b', 'a'),
      office('c', 'b'), // a→c→b→a
      office('eparch'),
      office('chancery', 'eparch'),
    ])
    expect(result.cycleDetected).toBe(true)
    const eparch = result.roots.find((r) => r.office.id === 'eparch')!
    expect(eparch.children.map((c) => c.office.id)).toEqual(['chancery'])
  })

  it('every node is placed exactly once, whatever the input shape', () => {
    const result = buildStructureTree([
      office('a', 'b'),
      office('b', 'a'),
      office('c', 'a'),
      office('root'),
      office('child', 'root'),
    ])
    const seen: string[] = []
    const walk = (nodes: typeof result.roots) =>
      nodes.forEach((n) => {
        seen.push(n.office.id)
        walk(n.children)
      })
    walk(result.roots)
    expect(seen.sort()).toEqual(['a', 'b', 'c', 'child', 'root'])
    expect(new Set(seen).size).toBe(seen.length)
  })
})
