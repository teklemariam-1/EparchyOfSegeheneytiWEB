import type { Field } from 'payload'

/**
 * Per-section publication switches.
 *
 * A priest's record holds things that are plainly public (his assignment) next
 * to things that are plainly not (his phone number), and the line between them
 * is not ours to draw — it differs per priest and belongs to the chancery. So
 * every substantive section carries its own switch, and the switch IS the
 * decision mechanism: nobody has to file a request to have a detail withheld.
 *
 * Defaults are deliberately asymmetric. Biography, ministry history and
 * education default to shown, because a directory that shows nothing is not a
 * directory. CONTACT DEFAULTS TO HIDDEN, and the migration adds the column with
 * that default — so no existing priest's phone number becomes public because a
 * schema changed underneath him.
 *
 * The switches are enforced in hooks/stripNonPublic, not in the page: a section
 * that is off must be ABSENT from the API response, not merely unrendered.
 */
export const visibilityGroup: Field = {
  name: 'visibility',
  type: 'group',
  label: 'What is public',
  admin: {
    description:
      'Controls what appears on this priest’s public page. Anything switched off is removed from the website and from the public API — not just hidden from view.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'showBio',
          type: 'checkbox',
          defaultValue: true,
          label: 'Biography',
          admin: { width: '33%' },
        },
        {
          name: 'showMilestones',
          type: 'checkbox',
          defaultValue: true,
          label: 'Ministry history',
          admin: { width: '33%' },
        },
        {
          name: 'showEducation',
          type: 'checkbox',
          defaultValue: true,
          label: 'Education',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'showGalleries',
          type: 'checkbox',
          defaultValue: true,
          label: 'Photo galleries',
          admin: { width: '33%' },
        },
        {
          name: 'showDates',
          type: 'checkbox',
          defaultValue: true,
          label: 'Ordination date',
          admin: {
            width: '33%',
            description: 'Birth date is never published — see the field itself.',
          },
        },
        {
          name: 'showContact',
          type: 'checkbox',
          defaultValue: false,
          label: 'Contact details',
          admin: {
            width: '33%',
            description: 'Off by default. Publishing a priest’s email or phone invites unsolicited contact.',
          },
        },
      ],
    },
  ],
}
