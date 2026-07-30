import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventTime } from '../EventTime'

/**
 * Regression: EventTime used to take FUNCTION props (anchorLabel/viewerLabel)
 * from a server component, which React cannot serialize across the RSC
 * boundary — every event detail page crashed with "Functions cannot be passed
 * directly to Client Components". The API is now string templates.
 */
describe('EventTime', () => {
  const iso = '2026-06-15T15:00:00Z' // 18:00 in Africa/Asmara (UTC+3)

  it('renders the Asmara-anchored time through the template', () => {
    render(
      <EventTime
        iso={iso}
        locale="en"
        anchorTemplate="{time} Asmara"
        viewerTemplate="{time} your time"
      />,
    )
    const time = screen.getByText(/Asmara/)
    expect(time.textContent).toMatch(/18:00|6:00/)
    expect(time).toHaveAttribute('dateTime', iso)
  })

  it('accepts only serializable props (templates are plain strings)', () => {
    // Type-level guarantee exercised at runtime: rendering with strings works
    // without any function props.
    const { container } = render(
      <EventTime iso={iso} locale="en" anchorTemplate="{time}" viewerTemplate="{time}" />,
    )
    expect(container.querySelector('time')).not.toBeNull()
  })

  it('renders nothing for an unparseable instant', () => {
    const { container } = render(
      <EventTime iso="not-a-date" locale="en" anchorTemplate="{time}" viewerTemplate="{time}" />,
    )
    expect(container.querySelector('time')).toBeNull()
  })
})
