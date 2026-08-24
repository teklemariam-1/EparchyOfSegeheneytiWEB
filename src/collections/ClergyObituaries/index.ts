import type { CollectionConfig, FieldHook } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { can, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { publishAtField } from '../../lib/payload/scheduledPublish'
import { slugifyGeez } from '../../lib/formatters/transliterate'
import { identityTab } from './fields/identity'
import { deathTab } from './fields/death'
import { familyTab } from './fields/family'
import { priesthoodTab } from './fields/priesthood'
import { ministryTab } from './fields/ministry'
import { retirementTab, characterTab } from './fields/character'
import { funeralTab, fixedTextsTab } from './fields/funeral'
import { computeAgeAtDeath, inheritFromPriest, defaultPublishedAt } from './hooks'

/**
 * ታሪኽ ሕይወት ካህን — the formal life story the chancery publishes when a priest
 * of the eparchy dies. The document has a fixed liturgical structure (opening
 * verse, announcement, ordination hymn, the life in order, character, funeral,
 * closing of mourning); the admin form captures it as structured fields with
 * the unchanging texts prefilled, and lib/obituary/compose assembles the full
 * Tigrinya document from them.
 */

/**
 * Slug from a transliteration of the (Ge'ez-script) full name plus the death
 * year — «ዑቕባገብርኤል ቀሺ ወልደማርያም» † 2026 → uqbagebriel-qeshi-weldemaryam-2026.
 * A typed slug is normalized and kept; a generated one never changes once
 * saved, because on later saves it IS the typed value.
 */
const obituarySlugHook: FieldHook = ({ value, data }) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return slugifyGeez(value)
  }
  const name = data?.fullName
  if (typeof name !== 'string' || !name.trim()) return value
  const base = slugifyGeez(name)
  if (!base) return value
  const death = data?.deathDate
  const year = typeof death === 'string' && death ? new Date(death).getUTCFullYear() : undefined
  return year ? `${base}-${year}` : base
}

export const ClergyObituaries: CollectionConfig = {
  slug: 'clergy-obituaries',
  labels: {
    singular: 'ታሪኽ ሕይወት ካህን / Clergy Life Story',
    plural: 'ታሪኽ ሕይወት ካህናት / Clergy Life Stories',
  },
  admin: {
    useAsTitle: 'fullName',
    group: 'Magisterium',
    defaultColumns: ['fullName', 'deathDate', 'funeralDate', '_status'],
    description:
      'ታሪኽ ሕይወት ዝዓረፉ ካህናት፣ ብቐዋሚ ሥርዓተ-ጽሑፍ። / The formal life stories of deceased priests, in the fixed liturgical structure.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/obituaries/${(doc as { slug?: string }).slug}`,
    hidden: hideUnless('clergy-obituaries.create', 'clergy-obituaries.update', 'clergy-obituaries.delete'),
  },
  access: {
    read: isPublishedOrAuthenticated,
    create: can('clergy-obituaries.create'),
    update: can('clergy-obituaries.update'),
    delete: can('clergy-obituaries.delete'),
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [
      requirePublishPermission('clergy-obituaries.publish'),
      inheritFromPriest,
      computeAgeAtDeath,
      defaultPublishedAt,
    ],
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('clergy-obituaries')
        safeRevalidatePath(`/obituaries/${doc.slug}`)
        safeRevalidatePath('/obituaries')
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTag('clergy-obituaries')
        safeRevalidatePath(`/obituaries/${doc.slug}`)
        safeRevalidatePath('/obituaries')
      },
    ],
  },
  fields: [
    publishAtField('clergy-obituaries.publish'),
    {
      type: 'tabs',
      tabs: [
        { label: 'መንነት / Identity', fields: identityTab },
        { label: 'ዕረፍቲ / Death', fields: deathTab },
        { label: 'ሓዳርን ስድራቤትን / Marriage & family', fields: familyTab },
        { label: 'ጉዕዞ ክህነት / Path to priesthood', fields: priesthoodTab },
        { label: 'ኣገልግሎት / Ministry', fields: ministryTab },
        { label: 'ግዜ ዕረፍቲ / Retirement', fields: retirementTab },
        { label: 'ጠባይን መንፈሳውነትን / Character', fields: characterTab },
        { label: 'ስነ-ስርዓት ቀብሪ / Funeral', fields: funeralTab },
        { label: 'ቀወምቲ ጽሑፋት / Fixed texts', fields: fixedTextsTab },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [obituarySlugHook] },
      admin: {
        position: 'sidebar',
        description:
          'Auto-generated from a transliteration of the full name plus the death year. Stable once saved.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
      ],
    },
  ],
  timestamps: true,
}
