# Things only an administrator can do

Some of the site is data, not code. This file lists the steps that need someone
signed in to `/admin` rather than a deploy — the ones that are easy to look for
in the codebase and never find, because there is nothing there to find.

## Adding pages to the public menu

The header and mobile menu come from the **Navigation** global, not from code.
There *is* a fallback menu in `src/lib/navigation/resolveNav.ts`, but it only
renders while the Navigation global is empty. Once staff have built a menu in
the admin, that menu is the whole truth: a link added in code will not appear.

To add a link:

1. Sign in to `/admin`, open **Globals → Navigation**.
2. Under the relevant top-level item, add a child with a label (fill in both
   English and Tigrinya) and a path.
3. Save. The header revalidates on its own; no deploy needed.

Links that exist as pages but may still need a menu entry:

| Page | Path | Suggested place |
| --- | --- | --- |
| Clergy directory and profiles | `/priests` | Ministries |
| Certificate requests | `/certificates` | Contact, or Resources |
| Mass intentions | `/mass-intentions` | Resources |

## What a priest publishes

Each priest's record carries a **What is public** panel. Every switch there
removes its section from the website *and* from the public API when it is off —
not merely from view, so switching something off is a real retraction rather
than a cosmetic one.

Two defaults are worth knowing:

- **Contact details are off** for every priest, including everyone whose record
  predates the feature. Turning it on publishes an email or phone number to the
  open internet, which attracts unsolicited contact; it should be a decision
  someone made, not something that happened to a record.
- **Birth dates are never published**, and there is deliberately no switch that
  changes that. They stay in the admin for the chancery's own records.

Individual milestones and individual photographs each have their own **Show
publicly** box, because withholding is usually about one entry — an assignment
that ended badly, a face a family would rather not see online — rather than a
whole section.

## Offices and the structure of the eparchy

The organogram on `/about` is built from the **Offices** collection: each office
points at its parent and carries a sort order. Set those and the tree redraws.
Until at least one office has structure configured, the section renders nothing
at all — a half-built organogram on the public About page would read as neglect.

If two offices are ever made each other's parent, the page still renders (the
cycle members are shown at the top level) and a warning naming the problem is
written to the server log.
