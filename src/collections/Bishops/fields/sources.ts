import type { Field } from 'payload'
import { documentsField, referenceLinksField } from './shared'

/**
 * Sources — reference links and documents at record level (Part C).
 *
 * The same two field factories also appear inside each milestone. Record level
 * is for what documents the man: the Holy See announcement of his appointment,
 * his catholic-hierarchy.org entry, the appointment bull. Milestone level is for
 * what documents one event. Both exist because forcing everything onto the
 * milestones would leave nowhere to put a source that covers a whole life.
 *
 * Public reference links become the `sameAs` array of the Person JSON-LD, which
 * is how search engines reconcile this page with the Holy See's own record.
 */
export const sourcesTab: Field[] = [
  referenceLinksField(
    'Where this record comes from, and where a reader can verify it — the Holy See announcement, news coverage, reference databases.',
  ),
  documentsField(
    'Documents belonging to him as a whole: the bull of appointment, collected pastoral letters, academic papers.',
  ),
]
