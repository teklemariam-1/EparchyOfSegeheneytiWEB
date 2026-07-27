# Tigrinya & terminology review — Eparch biography module

**Status: drafted by an AI assistant, NOT yet verified by a native speaker or by
the chancery. Four terms below were flagged as unknown before coding and were
filled with best-effort renderings so the feature could ship; they are the ones
to check first.**

24 new strings were added to `messages/ti.json` under the `bishop` namespace,
plus a set of ecclesiastical select options in
`src/collections/Bishops/terminology.ts`.

## Why a correction here is cheap

Every stored value is a **stable English kebab slug** — `enthronement`,
`principal-consecrator`, `roman-pontiff`. Nothing in the database holds a display
label. Correcting a term means editing `messages/ti.json` (public site) or the
English label in `terminology.ts` (admin form):

- **no migration**
- **no data rewrite**
- **no schema change**

This was a deliberate design choice, precisely because several of these terms
were uncertain when the module was written.

## The four flagged before coding — please supply the correct Tigrinya

These were explicitly identified as terms I would not guess. They are currently
filled with the renderings in the right-hand column, which should be treated as
placeholders rather than as proposals.

| Term | Where it appears | Currently rendered | Note |
|---|---|---|---|
| **Enthronement** | milestone type `enthronement`; the headline event of an Eparch's ministry | English label only (`Enthronement as Eparch`); no Tigrinya label is used in the admin form | I know መንበር = throne/see and that ሲመት covers ordination/consecration, but not the settled Tigrinya for enthronement **as distinct from** consecration. The public timeline shows the milestone's own title, which staff write, so nothing is currently mistranslated — but a proper term is wanted. |
| **Protosyncellus** | not yet a select option | — | Deliberately omitted rather than rendered as "Vicar General". Staff record it as a `curial-role` milestone with a free-text title today. Supply the term and it becomes a first-class option. |
| **Syncellus** | not yet a select option | — | Same. |
| **Episcopal motto** | Identity tab | `መሪሕ ቃል` (low confidence) | Only appears as a field label in the admin form. |

## Terms used with medium confidence — worth a second opinion

| English | Tigrinya used | Where |
|---|---|---|
| Eparchy | ሃገረ ስብከት | throughout |
| Eparch / Bishop | ጳጳስ | `bishop.title`, nav |
| Eparchs of Segeneyti | ጳጳሳት ሃገረ ስብከት ሰገነይቲ | `bishop.successionTitle` — **please confirm the spelling of ሰገነይቲ** |
| Sitting Eparch | ህሉው ጳጳስ | `bishop.sittingEparch` |
| Term of office | ዘመነ ኣገልግሎት | `bishop.term` |
| circa / approximately | ኣስታት | `bishop.circa` — printed before a year on imprecise dates, e.g. "ኣስታት 1998" |
| Ongoing | ይቕጽል ኣሎ | `bishop.ongoing` |
| Principal consecrator | ቀንዲ ሰያሚ | `bishop.role.principal-consecrator` |
| Co-consecrator | ተሓባባሪ ሰያሚ | `bishop.role.co-consecrator` |
| Formation (life period) | ስልጠና | timeline group heading |
| Origins (life period) | መበቆል | timeline group heading |
| Priesthood / Episcopacy | ክህነት / ጵጵስና | timeline group headings |
| Coat of arms | ኣርማ | `bishop.coatOfArms` |
| Biography | ታሪኽ ህይወት | `bishop.biography` |

The four life-period headings appear above every group of timeline entries, so
they are the most-read strings in the module after the Eparch's own name.

## Canonical points already settled — recorded here so they are not re-litigated

- **Segeneyti is one of the four eparchies of the Eritrean Catholic Church**, a
  **Metropolitan Church *sui iuris*** whose metropolitan see is **Asmara**
  (confirmed by the Eparchy, 2026-07-26).
- Consequently there is **no Patriarch and no Synod of Bishops** to model. Under
  CCEO those belong to patriarchal and major archiepiscopal Churches. The
  appointing-authority options are therefore **Roman Pontiff / Council of
  Hierarchs / Dicastery for the Eastern Churches**, with the Roman Pontiff as
  the default — he is who appoints eparchs of a metropolitan *sui iuris* Church,
  on a candidate list proposed by the Council of Hierarchs.
- **"Eparch" is used in formal contexts** (succession page, term records,
  JSON-LD `jobTitle`) and **"Bishop" in everyday navigation**, because Tigrinya
  uses ጳጳስ for both and `nav.bishop` already ships as ጳጳስ.
- **Baptism, chrismation and first communion are separate milestone types** even
  though the Ge'ez tradition normally confers all three together in infancy. A
  record that distinguishes them must not require a schema change; a record that
  does not simply uses `baptism`.

## Still open

- The About page states the Eparchy was **established in 1995**, while the brief
  describes it as new with its first bishop. Whichever is right, the succession
  page deliberately does **not** call anyone "the first Eparch" — it marks the
  incumbent and lists terms, nothing more.
- **Apostolic succession lineage is not modelled as a graph.** The principal
  consecrator is recorded by name (with an optional link to our `priests` data)
  on the consecration milestone and on the Ministry tab. A full lineage would
  have to traverse consecrators who will never be in our database, producing a
  chain of free text with the shape of a relationship and none of the guarantees.
  Say the word if the chancery wants it and it can be added without disturbing
  what is there.
