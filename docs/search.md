# Site search: how it works, and what it costs

Search spans News, Events, Bishop's and Pope's Messages, Parishes, Ministries,
Publications, Clergy, Offices and Vicariates. What is searchable is declared in
one place — [`src/lib/search/registry.ts`](../src/lib/search/registry.ts) — and
the results page, the header typeahead and the query executor all read from it.
Adding a collection to search is one entry there plus a label in both message
catalogues.

## The measurements

Taken on a scratch Neon database loaded with 50,000 news rows, which is far
beyond current content volume — the point was to see where this breaks, not to
flatter it.

| Query | Before | After | Plan after |
| --- | --- | --- | --- |
| English substring | 15–18 ms | **3.2 ms** | Bitmap Index Scan |
| Ge'ez substring | 15.6 ms | 15.6 ms | Seq Scan (unchanged) |
| Ge'ez, 6 spelling variants OR'd | — | 84 ms | Seq Scan, one pass |

## Why Ge'ez does not use the index

`pg_trgm` only extracts trigrams from characters Postgres considers
alphanumeric, and on this database no Ethiopic character qualifies:

```sql
SELECT show_trgm('ሰገነይቲ');   -- {}          ← no trigrams at all
SELECT 'ሰ' ~ '[[:alpha:]]';   -- false
SELECT show_trgm('bulletin'); -- {bul,ull,lle,...}
```

This is **not** a locale misconfiguration that can be fixed by setting
`LC_CTYPE`. It was verified three ways:

- default database (`C.UTF-8`, builtin provider) — no trigrams
- a database created with `LC_CTYPE 'en_US.UTF-8'` — no trigrams
- a database created with `LOCALE_PROVIDER icu ICU_LOCALE 'en-US'` — no trigrams

Arabic (`show_trgm('مرحبا')`) returns empty as well, so this affects every
non-Latin script, not Ge'ez specifically. Full-text search is no escape either:
`to_tsvector('simple', 'ሰገነይቲ')` produces no lexemes for the same reason.

**Consequence:** Tigrinya search is a sequential scan and will stay one. At
present volumes (hundreds of rows) that is well under a millisecond and not
worth another thought. Revisit if any searched table passes roughly **20,000
rows**, at which point a Ge'ez search costs ~6ms per table and the typeahead is
the first thing that will feel it.

If it ever needs solving, the realistic options are a shadow column holding a
transliterated or folded copy of the text maintained by a Payload hook and
indexed normally, or moving search out of Postgres. Neither is justified yet.

## Spelling variance

Tigrinya spells the same sound several ways, and the eparchy's own name is the
case that matters: **ሠገነይቲ** and **ሰገነይቲ** are both correct. Queries are
expanded into their plausible spellings so either one finds the other; see
[`src/lib/search/geez.ts`](../src/lib/search/geez.ts) for the consonant families
covered.

Expansion is capped at 4 variants because, unindexed, each variant is another
predicate against every row — the 84ms row in the table above is what six
variants cost. One ambiguous letter yields two variants, which covers the common
case.

## What search must never return

- **Unpublished and scheduled content.** Draft-enabled collections are
  constrained to `_status = published`, and the constraint sits outside the OR
  so no spelling variant can slip past it. Scheduling leaves a record as a draft
  until the cron flips it, so this covers future-dated posts too.
- **Anything a priest withheld.** A priest's biography, ministry history,
  education, galleries, contact details and dates each sit behind a visibility
  switch. Search reads only `fullName` and `assignment`, which every priest
  publishes unconditionally. This is enforced structurally — the fields are not
  in the registry — rather than by a filter, because there is then no clause to
  get wrong. A test asserts it.

  This matters more than it looks: matching against withheld text leaks it even
  when the text is never displayed. "His name comes back when I search this
  word" answers the question as well as printing the sentence would.
- **Rich-text fields.** Not a privacy rule but a correctness one. Rich text is
  stored as JSONB; `like` against JSONB throws, the per-category `catch`
  swallows it, and the whole category silently returns nothing. Only plain-text
  columns may be listed in the registry, and a test enforces that too.

## The typeahead

`/api/search` serves the header dropdown. It is the one search path a visitor
triggers without meaning to, so: minimum 2 characters, query length capped,
maximum 8 suggestions, no excerpts in the payload, rate limited to 40 requests
per minute per hashed client key, **failing closed**, and bots receive an empty
set. Responses are `private` — a shared cache keyed on the URL would serve one
visitor's search terms to another.

The dropdown is an accelerator only. The header contains a real `GET` form and
the results page is fully server-rendered, so search works with JavaScript
disabled.
