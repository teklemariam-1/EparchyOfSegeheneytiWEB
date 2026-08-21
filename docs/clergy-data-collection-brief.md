# Clergy data collection — the brief

The clergy directory at `/priests` is built but empty, and the site cannot open
to the public until it is filled. This file is the brief that produced the two
documents used to fill it: a covering letter to the Eparch, and a registration
form for each priest. Keep it here so a revision does not have to rediscover
the constraints.

## The prompt

> The Eparchy of Segheneyti website is finished and in its **testing phase** —
> everything asked for is built and working, but the site has not opened to the
> public. The largest remaining task is content, and the clergy directory in
> particular holds no records.
>
> Produce two documents, both bilingual in Tigrinya and English, both printable
> on A4, and both carrying the eparchy's existing visual identity (liturgical
> maroon `#911e1e`, gold accents, parchment ground, Georgia for display, Noto
> Serif Ethiopic for Ge'ez — all taken from `tailwind.config.ts`).
>
> **1. A covering letter** to His Excellency Abune Fikremariam Hagos, Bishop of
> the Catholic Eparchy of Segheneyti. Religious in register: open with the
> invocation of the Trinity, address him as ብጹእነትኩም / Your Excellency, close
> asking his prayers and paternal blessing. It must report the current status
> honestly, name what is built and what remains, petition for permission to
> circulate the registration form to all vicars and parish priests, and state
> plainly what the system does to protect the clergy's privacy. Leave the
> sender's name, role, and the return date as blanks — the chancery fills those
> and signs.
>
> **2. A registration form**, one sheet per priest, whose every field maps onto
> the `priests` collection in Payload so that a data-entry clerk can transcribe
> it without interpretation. Tigrinya label above, English label below, and the
> CMS field key shown in the margin. It must end with a consent section that
> mirrors the collection's `visibility` group, and a signature block.
>
> Draw the Tigrinya from the terms already in `messages/ti.json`, so the paper
> and the website speak with one vocabulary.

## The documents

All live in [docs/chancery/](chancery/) as Word files, ready to print, edit or
send. The clergy pair came first; the rest followed once it was clear the same
emptiness applies to every collection on the site:

| File | What it is | Fills |
| --- | --- | --- |
| `Letter-to-the-Eparch.docx` | 4 pages — the Tigrinya letter, then the English | — |
| `Clergy-Register-Form.docx` | 4 pages — one sheet per priest | `priests` |
| `Parish-Register-Form.docx` | 3 pages — one sheet per parish | `parishes` |
| `School-Register-Form.docx` | 3 pages — one sheet per school | `schools` |
| `Health-Facility-Register-Form.docx` | 3 pages — one per hospital, clinic or pharmacy | `clinics` |
| `Eparchy-History-Form.docx` | 4 pages — mission, figures, pillars, historical timeline | `about-page` global |
| `Eparch-Biographical-Record.docx` | 7 pages — the whole life of an Eparch | `bishops` |

Each form's fields map one-to-one onto the collection named above, with the CMS
field key printed in the margin, so a clerk transcribes rather than interprets.
Four points that came out of reading the schemas, and that a revision should not
undo:

- **Mass times take a 24-hour `HH:MM` or free text, never both invented.** The
  `startTime` validator rejects anything else, and "after sunrise" is a real
  liturgical answer — the parish form gives it its own column so nobody fabricates
  a number to fill the field.
- **Date precision is a first-class field, not a nicety.** `datePrecisionFields`
  exists so rural and historical records can say "circa 1958" instead of
  inventing 1 January. Every date on the eparch and clergy forms carries its
  precision control, and the forms say plainly why.
- **The eparch's milestone list is 25 codes.** They are printed as a legend
  rather than as free text, because `milestoneType` is a closed enum and a clerk
  guessing at it produces a save error.
- **The clinic and school forms carry a safeguarding condition** the schema does
  not encode: no identifiable patients at all, and no identifiable pupils without
  written parental consent. Worth keeping even though nothing in Payload enforces it.

They were authored as Word-flavoured HTML and converted through Word itself, so
they are genuine `.docx` and fully editable. Two things to know before
regenerating them:

- **Write the Tigrinya as literal UTF-8, never as numeric HTML entities.** A
  first pass used entities and produced convincing but wholly wrong glyphs,
  which survives every check except reading it.
- **Word maps `line-height` onto its own spacing rules.** `150%` becomes
  1.5-line spacing and inflates a two-page letter to six; `122%` is what reads
  as a normal letter.

The Ge'ez is set in **Nyala**, which ships with Windows, with Noto Sans
Ethiopic and Ebrima behind it. On a machine with none of the three the Tigrinya
would render as boxes, so check before sending to someone outside the chancery.

## One thing the chancery has to settle

The site does not currently say "Eparchy" in Tigrinya the same way twice. Three
renderings are live at once:

| Rendering | Where |
| --- | --- |
| ኤጳርቅና | `messages/ti.json` — `nav.about`, `parishes.subtitle`, `contact.subtitle` |
| ሃገረ ስብከት | `messages/ti.json` — `search.category.vicariates` |
| ኤፓርኪ | `scripts/seed.ts` — placeholder content |

"Parish" has the same problem: `ሰበካ` in the parishes pages, `ቁምስና` in the
contact-form subjects, `ኣብያተ ክርስትያን` in the search categories.

Every document in `docs/chancery/` uses **ሃገረ ስብከት** and **ሰበካ**, because the
first letter did and the set should be internally consistent. That is a
placeholder decision, not a ruling. Once the chancery settles it, the forms and
`messages/ti.json` should be brought into line together — and the same review
should cover the coined terms in [tigrinya-review-bishops.md](tigrinya-review-bishops.md),
which the eparch form leans on heavily.

## Field mapping

The form's sections transcribe directly into
[src/collections/Priests/index.ts](../src/collections/Priests/index.ts).

| Form section | Collection field | Notes |
| --- | --- | --- |
| 1 Identity | `title`, `fullName`, `birthDate`, `status` | `title` and `status` are enums — the form lists exactly the eight and three permitted values |
| 2 Present assignment | `assignment` (localized), `parish` (hasMany) | Tigrinya and English collected separately because the field is localized |
| 3 Ordination | `ordinationDate`, plus milestones of type `diaconate-ordination` / `priestly-ordination` | `datePrecision` is collected because older dates are often approximate |
| 4 Education | `education[]` — `institution` (required), `degree`, `year` | |
| 5 Ministry history | `milestones[]` — the ten `milestoneType` values are printed as a numbered legend | Per-row **Publish** tick maps to `milestones[].isPublic` |
| 6 Biography | `bio` (localized, richText) | |
| 7 Contact | `contact.email`, `contact.phone` | |
| 8 Photographs | `photo`, `galleries[]` | |
| 9 What is published | the `visibility` group | one tick per switch |
| 10 Signature | — | paper record of consent; nothing in the CMS |

## The three privacy rules the documents commit to

These are not promises the paper makes on the software's behalf — they are
already enforced in code, and the wording was chosen to match.

1. **Birth dates are never published.** `stripNonPublicPriestData` deletes
   `birthDate` unconditionally for anonymous readers, and there is deliberately
   no visibility switch for it.
   See [src/collections/Priests/hooks/stripNonPublic.ts](../src/collections/Priests/hooks/stripNonPublic.ts).
2. **Contact details are off by default.** `visibility.showContact` defaults to
   `false` while every other switch defaults to `true`.
3. **Withholding is a real retraction.** The strip hook runs on `afterRead`, so
   an unticked box removes the section from the public API too, not just from
   the rendered page. Individual milestones and photographs carry their own
   `isPublic`, which is why the form has a per-row tick rather than one switch
   for the whole table.

## Tigrinya that still needs the chancery

The Tigrinya in both documents follows `messages/ti.json` wherever a term
already existed there. Two known inconsistencies in the catalogue were resolved
by choosing one form, and the chancery should confirm the choice:

- **Parish** — the catalogue carries both ሰበካ (`vicariates`, `parishes`) and
  ቁምስና (`contact.subjects.parish`). The documents use **ሰበካ**.
- **Eparchy** — the catalogue carries both ሃገረ ስብከት and ኤጳርቅና. The documents
  use **ሃገረ ስብከት**, matching the Eparch's formal title in `scripts/seed.ts`.

Terms coined for these documents, having no precedent in the catalogue, need
review before the form is printed in quantity: ሲመተ ዲቁና (diaconate ordination),
ሲመተ ክህነት (priestly ordination), ማዕርግ (title/rank), and ልክዕነት ዕለት (date
precision). This is the same review already open in
[docs/tigrinya-review-bishops.md](tigrinya-review-bishops.md).

## What has to happen before the site opens

1. The Eparch approves and the form is circulated to the vicars.
2. Completed forms return to the chancery.
3. Someone with the `priests.create` permission transcribes each into
   `/admin/collections/priests`, setting the visibility switches from section 9.
4. The signed forms are kept — they are the record of consent.
