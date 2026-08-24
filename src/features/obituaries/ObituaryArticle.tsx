import Image from 'next/image'
import type { ClergyObituary } from '@/types/payload-types'
import { RichText } from '@/components/shared/RichText'
import { ShareButtons } from '@/components/shared/ShareButtons'
import {
  composeObituary,
  sortAssignments,
  assignmentText,
  type ObituaryLocale,
} from '@/lib/obituary/compose'
import { CopyFullTextButton } from './CopyFullTextButton'

/**
 * The ታሪኽ ሕይወት as an article: a parchment panel, the opening verse as an
 * epigraph, the ministry as a timeline, virtues and scripture as set pieces.
 *
 * Prose sentences (birth, marriage, ordination, the timeline rows) come from
 * the same composer that feeds the copy-full-text button, so what is read,
 * what is copied, and what is printed are one text. The `obituary-article`
 * class scopes the print stylesheet in globals.css.
 */

const PROSE_SECTION_IDS = ['opening', 'birth', 'marriage', 'ordination', 'fullCommunion'] as const

export function ObituaryArticle({ doc, locale }: { doc: ClergyObituary; locale: ObituaryLocale }) {
  const composed = composeObituary(doc, locale)
  const byId = new Map(composed.sections.map((s) => [s.id, s]))
  const assignments = sortAssignments(doc.assignments)
  const photo = typeof doc.photo === 'object' ? doc.photo : null
  const honorific = (doc.honorific === 'other' ? doc.honorificOther : doc.honorific) ?? ''
  const birthYear = doc.birthDate ? new Date(doc.birthDate).getUTCFullYear() : null
  const deathYear = doc.deathDate ? new Date(doc.deathDate).getUTCFullYear() : null
  const character = byId.get('character')
  const hymn = doc.ordinationHymn

  return (
    <article className="obituary-article rounded-lg border border-gold-200 bg-parchment-50 px-5 py-8 shadow-sm sm:px-10 sm:py-12">
      {/* Epigraph — the opening verse. */}
      {byId.has('verse') ? (
        <p className="obituary-epigraph mx-auto max-w-xl border-y border-gold-300 py-4 text-center font-serif text-lg italic text-maroon-800">
          {byId.get('verse')!.body}
        </p>
      ) : null}

      {/* Portrait, name, years. */}
      <header className="mt-10 text-center">
        {photo?.url ? (
          <div className="obituary-portrait relative mx-auto h-44 w-44 overflow-hidden rounded-full ring-4 ring-gold-300">
            <Image
              src={photo.url}
              alt={photo.alt || doc.fullName}
              fill
              sizes="176px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <h1 className="mt-5 font-serif text-2xl font-bold text-charcoal-900 sm:text-3xl">
          {honorific} {doc.fullName}
        </h1>
        {birthYear && deathYear ? (
          <p className="mt-1 text-lg text-maroon-700">
            ✝ {birthYear}–{deathYear}
          </p>
        ) : null}
        <div className="mx-auto mt-4 h-px w-24 bg-gold-400" aria-hidden="true" />
      </header>

      {/* The announcement and the life, sentence by sentence. */}
      <div className="prose prose-eparchy mx-auto mt-8 max-w-none font-serif text-charcoal-800">
        {PROSE_SECTION_IDS.map((id) => {
          const s = byId.get(id)
          return s ? <p key={id}>{s.body}</p> : null
        })}
      </div>

      {/* The ordination-day hymn, Ge'ez above its Tigrinya. */}
      {hymn?.geez ? (
        <div className="mx-auto mt-8 max-w-xl rounded-md border-s-4 border-maroon-700 bg-maroon-50 px-6 py-5">
          <p className="font-serif text-maroon-900">«{hymn.geez}»</p>
          {hymn.tigrinya ? (
            <p className="mt-3 text-sm text-charcoal-700">«{hymn.tigrinya}» እናበልና ነዝይም።</p>
          ) : null}
        </div>
      ) : null}

      {/* Ministry assignments as a timeline. */}
      {assignments.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold text-maroon-800">ጉዕዞ ኣገልግሎት</h2>
          <ol className="mt-5 space-y-6 border-s-2 border-maroon-700 ps-6">
            {assignments.map((row, i) => {
              const text = assignmentText(row)
              if (!text) return null
              return (
                <li key={row.id ?? i} className="obituary-timeline-row relative">
                  <span
                    className="absolute -start-[31px] top-1.5 h-3 w-3 rounded-full bg-gold-400 ring-2 ring-parchment-50"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold uppercase tracking-wide text-maroon-700">
                    {row.periodDisplay}
                  </p>
                  <p className="mt-1 font-serif text-charcoal-800">{text}</p>
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}

      {/* Retirement ministry. */}
      {doc.retirementDescription ? (
        <div className="prose prose-eparchy mx-auto mt-8 max-w-none font-serif text-charcoal-800">
          <RichText data={doc.retirementDescription} className="" />
        </div>
      ) : null}

      {/* Character: verse, summary, virtues, scripture pull-quotes, hope. */}
      {character ? (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold text-maroon-800">{character.heading}</h2>
          {doc.characterVerse?.text ? (
            <p className="mt-3 font-serif italic text-charcoal-700">
              {doc.characterVerse.text}
              {doc.characterVerse.reference ? ` (${doc.characterVerse.reference})` : ''}
            </p>
          ) : null}
          {doc.characterSummary ? (
            <div className="prose prose-eparchy mt-3 max-w-none font-serif text-charcoal-800">
              <RichText data={doc.characterSummary} className="" />
            </div>
          ) : null}
          {(doc.virtues ?? []).length > 0 ? (
            <ul className="mt-4 space-y-2">
              {doc.virtues.map((v, i) =>
                v.text ? (
                  <li key={v.id ?? i} className="flex items-start gap-3 font-serif text-charcoal-800">
                    <span className="mt-0.5 text-gold-500" aria-hidden="true">
                      ✣
                    </span>
                    {v.text}
                  </li>
                ) : null,
              )}
            </ul>
          ) : null}
          {(doc.scriptureReflections ?? []).map((r, i) =>
            r.text ? (
              <blockquote
                key={r.id ?? i}
                className="mt-5 border-s-4 border-gold-400 ps-4 font-serif italic text-maroon-800"
              >
                «{r.text}»
                <footer className="mt-1 text-sm not-italic text-charcoal-600">{r.reference}</footer>
              </blockquote>
            ) : null,
          )}
          {doc.hopeStatement ? (
            <div className="prose prose-eparchy mt-5 max-w-none font-serif text-charcoal-800">
              <RichText data={doc.hopeStatement} className="" />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Funeral report and the closing. */}
      <div className="prose prose-eparchy mx-auto mt-10 max-w-none font-serif text-charcoal-800">
        {byId.has('funeral') ? <p>{byId.get('funeral')!.body}</p> : null}
        {doc.acknowledgements ? <RichText data={doc.acknowledgements} className="" /> : null}
        {doc.condolencePrayer ? <RichText data={doc.condolencePrayer} className="" /> : null}
        {doc.mourningClosed && doc.mourningClosedText ? (
          <p className="font-semibold text-maroon-800">{doc.mourningClosedText}</p>
        ) : null}
      </div>

      <div className="mx-auto mt-10 h-px w-24 bg-gold-400 print:hidden" aria-hidden="true" />

      {/* Share and copy — hidden in print. */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
        <ShareButtons title={`${honorific} ${doc.fullName}`} />
        <CopyFullTextButton text={composed.fullText} />
      </div>
    </article>
  )
}
