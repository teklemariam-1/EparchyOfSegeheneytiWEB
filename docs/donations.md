# Donations

Two payment methods run side by side, and neither replaces the other.

| | Manual transfer | Card (Stripe Checkout) |
|---|---|---|
| Who it serves | Everyone, **including donors inside Eritrea** | The diaspora and international supporters |
| Currencies | Any, including **ERN** | Only currencies Stripe supports — **never ERN** |
| How it settles | Donor transfers, treasurer reconciles by reference code | Stripe charges the card, a webhook confirms it |
| Recurring | Monthly pledges supported | One-time only (see [Recurring giving](#recurring-giving)) |

There is no configuration in which card payments alone are sufficient. Cards are
unusable inside Eritrea, so **manual transfer must stay switched on**.

---

## ⚠ Before card donations can go live

**Stripe does not support Eritrea as a business or payout country.** There is no
route to a live Stripe account for an Eritrea-registered entity, and no code
change alters that.

This integration assumes a Stripe account held by a **legal entity registered in
a Stripe-supported country** — a diaspora support association, a partner
diocese, or a fiscal sponsor — with a bank account in that same country,
collecting on the Eparchy's behalf.

That entity's country, settlement currency and payout schedule are properties of
`STRIPE_SECRET_KEY` and of the `donation-settings` global. Nothing about it is
hardcoded, so changing the arrangement later is a configuration change.

What has to be resolved outside this repository, before switching a card method
on in production:

1. Incorporate or partner with an entity in a supported country, with a bank
   account there.
2. Complete Stripe KYC in that entity's name.
3. Settle the legal and tax position of funds raised for the Eparchy landing in
   a third-country entity, and how they are remitted onward.
4. Decide the donor-facing disclosure. Stripe's Checkout page and the card
   statement show **that entity's** name, not the Eparchy's. Two settings exist
   for this and both should be filled in:
   - `stripeStatementDescriptor` — up to 22 characters on the card statement.
   - `stripeAccountNotice` — localized text shown beside the card option,
     explaining who receives the money.

Until then, leave `STRIPE_SECRET_KEY` unset. The card option disappears
automatically and donations fall back to manual transfer; nothing breaks.

---

## Configuration (`donation-settings` global)

| Setting | Effect |
|---|---|
| `enabled` | Master switch for the donate page and all CTAs. |
| `provider` | `manual`, `stripe`, or `both`. With no `STRIPE_SECRET_KEY` on the server, card is suppressed regardless. |
| `preferManualForCountries` | ISO codes whose visitors see manual transfer first. Defaults to `ER`. |
| `currencies` | What a donor may choose. May include ERN. |
| `stripeCurrencies` | Which of those can be charged to a card. **Cannot include ERN** — unsupported codes are dropped rather than offered. |
| `presetAmounts`, `minAmount`, `maxAmount` | Enforced server-side on every submission, never trusted from the browser. |
| `publicTransferDetails` | Account name, bank, account number, SWIFT — **published verbatim** on the donate page and in the pledge email. |
| `manualInstructions` | Localized extra notes (branch, hours, mobile-money steps). Do not repeat the account details here. |
| `receivingAccount` | Private, encrypted, super-admin only. **Never published.** This is the internal record; `publicTransferDetails` is what donors see. |

If `publicTransferDetails` is empty, donors are told to contact the chancery and
quote their reference code, instead of being shown a blank panel.

---

## How a donation actually flows

### Manual transfer

1. Donor submits the form. A `pending` donation is created with a
   server-generated **reference code** (`SEG-4KQ7HP`).
2. The donor sees the transfer details and their reference on screen, and gets
   the same by email. The wording is explicit that the gift is **not complete
   yet**.
3. The Eparchy is notified (`DONATION_NOTIFICATION_EMAIL`, falling back to
   `CONTACT_NOTIFICATION_EMAIL`).
4. When the transfer lands, the treasurer finds the pledge by reference —
   searchable in the admin list — and sets the status to **Succeeded**.

The reference code is the whole point. Codes avoid characters that get misread
when handwritten or read over a phone (no `I O S U Z 0 1 2 5`), and the lookup
accepts `seg 4kq7hp` and `SEG4KQ7HP` as the same code.

### Card

1. Donor submits with the card method. A `pending` donation is created.
2. The server computes the amount **in integer minor units from the settings**
   and creates a Stripe Checkout Session. The browser cannot influence the
   price; it only sends a candidate value that is re-derived and bounded.
3. The donor is redirected to `checkout.stripe.com`. **No card data ever touches
   this site** — that is what keeps it in the smallest PCI scope (SAQ-A).
4. Stripe sends `checkout.session.completed` to `/api/webhooks/stripe`. The
   signature is verified against the raw body and the donation is promoted to
   `succeeded`.
5. The donor lands on `/donate/complete`. **That page never marks anything
   paid.** If the webhook has not arrived it shows "confirming your gift" and
   polls for a while.

> Landing on the success URL is not proof of payment — anyone can type it, and a
> donor whose connection drops after paying never loads it. A donation is only
> ever promoted by a verified webhook. The
> `donations` collection enforces this at the data layer: setting
> `succeeded`/`refunded`/`disputed` on a Stripe donation throws unless the
> request carries the webhook's context flag.

---

## Local development

### 1. Environment

```bash
STRIPE_SECRET_KEY=sk_test_...          # from the Stripe dashboard, test mode
STRIPE_WEBHOOK_SECRET=whsec_...        # printed by `stripe listen`, see below
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # optional; hosted Checkout does not need it
```

With a `sk_test_` key the donate page shows a "Test mode" notice, so nobody
mistakes a test run for a real gift.

### 2. Forward webhooks to the dev server

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

`stripe listen` prints its own signing secret:

```
> Ready! Your webhook signing secret is whsec_abc123...
```

Put **that** value in `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`. It is a
different secret from the one on a dashboard endpoint — using the wrong one
makes every event fail signature verification with a 400.

### 3. Trigger events without paying

```bash
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```

Triggered events carry Stripe's own fixture data with no `donationId` metadata,
so they are recorded in **Stripe Events** in the admin as `failed` with "no
donation for …". That is the correct outcome and confirms the handler is
receiving and verifying deliveries. To exercise the full path, make a real test
payment through the donate form instead.

### 4. Test cards

Any future expiry date, any 3-digit CVC, any postcode.

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0025 0000 3155` | Requires 3-D Secure authentication |
| `4000 0000 0000 9995` | Declined — insufficient funds |
| `4000 0000 0000 0002` | Declined — generic |
| `4000 0000 0000 0341` | Attaches, then fails when charged |
| `4000 0000 0000 0259` | Succeeds, then a dispute is created |

Full list: <https://stripe.com/docs/testing>.

### 5. Replay a delivery

Every event is recorded in the **Stripe Events** collection with its id, type
and outcome. To retry one, use `stripe events resend evt_…` or the "Resend"
button in the dashboard. A replayed event is a **no-op** — the event id carries
a unique constraint and the handler inserts before processing, so a duplicate
can never post the same gift twice.

---

## Reconciliation

The Donations list has a summary panel above it:

- Totals **per currency** for today / this month / this year / all time. Mixing
  ERN and USD into one number would be meaningless, so each currency is on its
  own line.
- Gift count, average gift, unique donors.
- A warning when any donation has been `pending` for more than 24 hours — a
  transfer that never arrived, or a webhook that never landed.
- **Export CSV** — row-level, for reconciling against a bank statement. Donor
  email and message are included only for staff holding `donations.manage`.

"Group & total donations" gives count and sum grouped by currency, month,
method or status, computed in Postgres.

### Statuses

| Status | Meaning |
|---|---|
| `pending` | Recorded; no money received. |
| `succeeded` | Card charged, or transfer confirmed by staff. |
| `failed` | Card declined, or the checkout session expired. |
| `refunded` | Fully refunded. A **partial** refund keeps `succeeded` and records `refundedAmountMinor`. |
| `disputed` | The donor's bank raised a chargeback. Needs staff action inside Stripe's evidence deadline. |
| `cancelled` | A manual pledge staff abandoned. Not part of the card lifecycle. |

---

## Money

`amountMinor` is the canonical amount: an integer count of the currency's minor
unit, exactly what Stripe charged. `amount` is a major-unit decimal derived from
it by a collection hook, kept only for the admin list and the existing "Amount
raised" aggregation. Never edit `amount` directly.

Zero-decimal currencies (JPY, KRW, XOF, …) are not multiplied; three-decimal
ones (KWD, BHD, …) are rounded to a multiple of ten as Stripe requires.
Conversion shifts digits in the text the donor typed rather than multiplying a
float — `1.005 * 100` is `100.49999999999999` and `(1.005).toFixed(2)` is
`"1.00"`, and both quietly round a gift down.

`amount_minor` is a Postgres `numeric`, so it comes back from the driver as a
**string**. Always read it through `Number()`.

---

## Recurring giving

Monthly **manual pledges** work. Monthly **card** gifts do not: Stripe Billing
is not wired up, and taking a single payment while labelling it monthly would be
a lie to the donor. The form and the server both refuse that combination.

The schema already carries `stripeSubscriptionId`, and the webhook handler
recognises `customer.subscription.*` and `invoice.*` and records them as
explicitly ignored, so enabling Billing later is additive rather than a
migration.

---

## Applying the migration to production

`main` does not auto-deploy (`vercel.json` sets
`git.deploymentEnabled.main = false`), so this ships only when a deploy is run
deliberately.

Production is **migrations only** — `push` is disabled outside development.
`npm run vercel-build` runs `payload migrate` as part of the build.

The migration `20260726_054250_stripe_donations`:

- adds `amount_minor` **nullable**, backfills it from `amount` using each row's
  own currency exponent, and only then sets `NOT NULL`;
- maps the old status `received` → `succeeded` **before** replacing the enum,
  because casting `'received'` into the new type would abort;
- drops `donations.provider_ref` (superseded by the typed Stripe id columns) and
  `donation_settings.stripe_publishable_key` (key material now lives only in
  environment variables).

Take a database snapshot first. The `down()` migration is deliberately lossy —
rolling back collapses `refunded` and `disputed` into `cancelled`, because the
old schema cannot express them.

---

## Security notes

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only and never
  reach the client bundle. Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is public.
- No Stripe key is stored in the database. A secret in a globals row is a secret
  in every backup.
- CSP allows `js.stripe.com`, `hooks.stripe.com` and `api.stripe.com`, and
  `form-action` allows `checkout.stripe.com` — without that last one the
  redirect to Checkout is blocked by the browser. See `next.config.ts`.
- Donor email and message are field-restricted to `donations.manage`;
  `donations.view` sees the ledger without the congregation's address book.
- `/donate/complete` requires the reference code to match the record. Donation
  ids are sequential, so without that check anyone could walk `?id=1,2,3` and
  read the giving history.
- No card data is stored or logged anywhere. The only card-related string
  persisted is Stripe's own decline reason.
