import type { GlobalConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { can } from '../../lib/permissions/access'
import { BANNER_THEME_OPTIONS } from '../../lib/banner-themes'

export const BannerSettings: GlobalConfig = {
  slug: 'banner-settings',
  label: 'Banner Theme',
  admin: {
    group: 'Settings',
    description:
      'Seasonal colour theme for the page banners (the coloured header at the top of News, Events, Parishes, etc.). Changes apply site-wide within a few minutes — no redeploy needed.',
  },
  access: { read: () => true, update: can('globals.banner-settings.edit') },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('globals')
        safeRevalidatePath('/', 'layout')
      },
    ],
  },
  fields: [
    {
      name: 'mode',
      type: 'radio',
      defaultValue: 'manual',
      options: [
        { label: 'Manual — always use the theme selected below', value: 'manual' },
        { label: 'Scheduled — switch automatically by date range', value: 'scheduled' },
      ],
    },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'default',
      options: BANNER_THEME_OPTIONS,
      admin: {
        description:
          'The active theme. In Scheduled mode this is the fallback used on dates not covered by any schedule entry.',
      },
    },
    {
      name: 'custom',
      type: 'group',
      label: 'Custom Colours',
      admin: {
        description: 'Only used when the theme is set to "Custom colours…".',
        condition: (data) =>
          data?.theme === 'custom' ||
          (Array.isArray(data?.schedule) && data.schedule.some((s: any) => s?.theme === 'custom')),
      },
      fields: [
        {
          name: 'background',
          type: 'text',
          admin: { description: 'Banner background colour. Hex value, e.g. #4b2e83' },
        },
        {
          name: 'subtitleColor',
          type: 'text',
          admin: { description: 'Subtitle text colour — pick a light tint that reads on the background.' },
        },
        {
          name: 'accentColor',
          type: 'text',
          admin: { description: 'Colour of the short underline bar beneath the page title.' },
        },
        {
          name: 'patternOpacity',
          type: 'number',
          min: 0,
          max: 100,
          admin: { description: 'Visibility of the cross pattern: 0 = hidden, 100 = fully visible. Default 5.' },
        },
      ],
    },
    {
      name: 'image',
      type: 'group',
      label: 'Banner Image (optional)',
      admin: {
        description:
          'Upload a designed banner image to use as the background of every page banner. It fully replaces the coloured design and shows exactly as uploaded. Remove the image to return to plain seasonal colours.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Recommended: wide image, at least 1920×500px. Keep important details away from the left side, where the page title sits.',
          },
        },
        {
          name: 'opacity',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 100,
          admin: {
            description:
              'Opacity of the image itself. 100 (default) = fully visible; lower it to fade the image into the theme colour behind it.',
            condition: (data) => Boolean(data?.image?.image),
          },
        },
        {
          name: 'overlayOpacity',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: {
            description:
              'Optional theme-colour tint over the image. 0 (default) = image shown exactly as uploaded. Raise it (e.g. 40–65) only if the white page title is hard to read on your image.',
            condition: (data) => Boolean(data?.image?.image),
          },
        },
      ],
    },
    {
      name: 'schedule',
      type: 'array',
      label: 'Seasonal Schedule',
      admin: {
        description:
          'Date ranges when a theme should apply automatically (e.g. Advent 2026: Nov 29 – Dec 24). The first matching entry wins; dates include the year, so update them each liturgical year.',
        condition: (data) => data?.mode === 'scheduled',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: { description: 'For your own reference, e.g. "Advent 2026".' },
        },
        {
          name: 'theme',
          type: 'select',
          required: true,
          defaultValue: 'advent',
          options: BANNER_THEME_OPTIONS,
        },
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly' }, description: 'Inclusive — the theme still shows on this day.' },
        },
      ],
    },
  ],
}
