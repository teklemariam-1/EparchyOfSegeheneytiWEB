import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { getOfficesStructure } from '@/lib/payload/queries'
import { buildStructureTree, type StructureNode } from '@/lib/offices/structureTree'

/**
 * "Structure of the Eparchy" — the office tree on the About page.
 *
 * Entirely admin-shaped: staff set each office's parent and sibling order in
 * the Offices collection, and the tree redraws. When no office has any
 * structure configured, the whole section renders nothing — a half-built
 * organogram on the public About page would be worse than none.
 *
 * Nested lists rather than an SVG chart on purpose: a <ul> tree reads
 * correctly in a screen reader, reflows on a phone, and prints — the three
 * things an organogram graphic reliably fails at.
 */

function OfficeNode({ node, depth }: { node: StructureNode; depth: number }) {
  const { office, children } = node
  return (
    <li className="relative">
      <Link
        href={`/offices/${office.slug}`}
        className="group flex flex-col rounded-lg border border-charcoal-100 bg-white px-4 py-3 transition-colors hover:border-maroon-300"
      >
        <span className="font-serif text-sm font-semibold text-charcoal-900 group-hover:text-maroon-800">
          {office.name}
        </span>
        {(office.leaderName || office.leaderRole) && (
          <span className="mt-0.5 text-xs text-charcoal-500">
            {[office.leaderName, office.leaderRole].filter(Boolean).join(' · ')}
          </span>
        )}
      </Link>
      {children.length > 0 && (
        <ul
          className="mt-2 space-y-2 border-l-2 border-gold-300/60 pl-4"
          // Depth is unbounded in data but bounded in practice; the guard is
          // cosmetic — beyond 6 levels the indentation stops growing.
          style={depth < 6 ? undefined : { paddingLeft: 8 }}
        >
          {children.map((child) => (
            <OfficeNode key={child.office.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export async function EparchyStructure() {
  const locale = await getLocale()
  const t = await getTranslations('about')
  const offices = await getOfficesStructure(locale)
  const { roots, cycleDetected } = buildStructureTree(offices)

  if (cycleDetected) {
    // Staff-facing signal, not visitor-facing: the page still renders what it
    // can, and whoever reads the logs learns which knot to untie in the admin.
    console.warn('[eparchy-structure] cycle in office parent links — check Offices → Structure fields')
  }

  if (roots.length === 0) return null

  return (
    <Section className="bg-parchment-50">
      <Container size="narrow">
        <h2 className="mb-2 font-serif text-2xl font-bold text-charcoal-900 md:text-3xl">
          {t('structureTitle')}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-charcoal-600">{t('structureIntro')}</p>
        <ul className="space-y-3">
          {roots.map((root) => (
            <OfficeNode key={root.office.id} node={root} depth={0} />
          ))}
        </ul>
      </Container>
    </Section>
  )
}
