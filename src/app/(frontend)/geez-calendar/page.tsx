import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: "Ge'ez Calendar",
  description: "Liturgical calendar of feasts, fasts, and saints' days in the Ge'ez tradition.",
  path: '/geez-calendar',
})

export default function GeezCalendarPage() {
  return (
    <>
      <PageHeader
        title="ግጻዌ — Ge'ez Calendar"
        subtitle="Feasts, fasts, and liturgical days of the Ge'ez tradition."
        breadcrumbs={[{ label: "Ge'ez Calendar" }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            The Ge&apos;ez liturgical calendar will appear here. This section is connected to the
            GeezCalendarEntries collection in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
