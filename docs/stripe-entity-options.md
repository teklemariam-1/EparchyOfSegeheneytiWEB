# Resolving the Stripe entity — options and recommendation

The card-donation code is complete and tested. It is blocked on one thing that
cannot be solved in a codebase: **Stripe has no route to a live account for an
Eritrea-registered entity.** Eritrea is on Stripe's unsupported list, alongside
countries excluded by US regulation or by the absence of payout rails. Stripe
supports 46 countries; Eritrea is not one, and no amount of configuration
changes that.

So the question is not "how do we make Stripe accept the Eparchy" — it is
**"which legal body receives card gifts on the Eparchy's behalf, and how does
the money reach Segheneyti?"** That is a governance decision for the Eparchy, not
a technical one. This document lays out the three real answers so it can be
decided rather than deferred.

---

## What can be done today, with no entity at all

A Stripe account can be created and used in **test mode immediately**, without
business verification or KYC. Test keys are issued at signup; only *activating*
for live payments requires the entity and its documents.

That means the entire integration can be validated end to end — real Checkout
pages, real webhooks, real receipts, real admin records — before any of the
decisions below are made. Nothing is charged and no real money moves.

To do that: create a Stripe account, copy the test keys into `.env.local`, and
follow the local workflow in [donations.md](./donations.md). Ten minutes, no
commitment. (Someone at the Eparchy has to do this — it means accepting Stripe's
terms of service, which is a legal act.)

---

## The three routes

### A. Point the card option at a partner organisation

The "Card" button links out to an existing Catholic charity's donation page,
earmarked for Segheneyti. The Eparchy holds no Stripe account and takes on no
legal or financial exposure.

**CNEWA** (Catholic Near East Welfare Association) is the obvious first
approach: it is a papal agency, founded 1926, with a specific mandate for the
Eastern Catholic Churches, and its published materials name the eparchies of
Barentu, Keren and **Seghenity** among those it supports. Its named funding
partners for the Eritrean Church include Caritas Germany, Aid to the Church in
Need, the Archdiocese of Cologne, the Italian Episcopal Conference, Misereor,
Missio and Porticus — any of which is a plausible second approach. In the UK,
FACE (Fellowship and Aid to the Christians of the East) maintains an Eritrean
Catholic Church programme.

| | |
|---|---|
| **Time to live** | Weeks — one conversation and a link |
| **Cost** | None |
| **Legal exposure** | None |
| **Donor tax receipt** | Yes, from the partner |
| **Trade-off** | The donor leaves our site. **No record lands in our ledger** — the admin totals, CSV export and reconciliation only cover manual transfers. Remittance depends on the partner's schedule and any earmarking they will accept. |

This route **does not use the integration just built**. It is an outbound link.
It is listed first because it is the only option that can be live this month,
and because a working link beats a perfect ledger nobody can donate into.

### B. A diaspora support association

Register a small nonprofit in a Stripe-supported country — the US and Germany
are the obvious candidates given where Eritrean Catholic communities are
concentrated (Washington DC, Atlanta, Dallas, Charlotte, Minneapolis, Toronto;
Ge'ez-rite communities in Germany and Sweden) — run by diaspora volunteers, with
a bank account and its own Stripe account, remitting to the Eparchy.

The Bishop has made at least two fundraising visits to the United States, so a
supporter network to staff this plausibly already exists.

| | |
|---|---|
| **Time to live** | 3–9 months (incorporation, EIN, 501(c)(3) determination, bank account, Stripe KYC) |
| **Cost** | Filing fees, plus ongoing accounting and annual returns |
| **Legal exposure** | Real. A board with fiduciary duty, annual filings, and liability for how funds are handled |
| **Donor tax receipt** | Yes, once exempt status is granted |
| **Trade-off** | Most control and the best donor experience. Slowest, and it only works if two or three people will genuinely commit to running it for years — an association that lapses is worse than none |

**Works with the integration as built.** Its Stripe key goes in the env var.

### C. Fiscal sponsorship

An existing 501(c)(3) holds the funds and the Stripe account under its own EIN,
and runs the Eparchy's giving as a restricted fund. No new entity, no new board,
no annual filings.

| | |
|---|---|
| **Time to live** | 4–12 weeks |
| **Cost** | Typically 5–10% of donations as an administrative fee |
| **Legal exposure** | Low — the sponsor carries the compliance burden |
| **Donor tax receipt** | Yes, from the sponsor |
| **Trade-off** | The fee is permanent. The sponsor has legal discretion over the funds, so the relationship depends on trust and a clear written agreement |

**Works with the integration as built** if the sponsor will let the Eparchy's
site create Checkout Sessions against their account — worth asking explicitly,
as some sponsors insist on hosting the donation page themselves, which collapses
this into route A.

---

## Recommendation

**Pursue A and C together, and treat B as the destination if the diaspora
network turns out to be strong enough to staff it.**

Approach CNEWA first. That single conversation likely resolves both routes at
once: they may take earmarked gifts for Segheneyti directly (route A, live in
weeks), and if not, they know which of their partner agencies does this kind of
sponsorship (route C).

Set route A live as soon as it exists, even though it bypasses our ledger. The
manual transfer flow — which now actually works — carries in-country giving and
anyone willing to make a bank transfer, and it is the flow that produces
reconcilable records. Card giving through a partner is a supplement, not a
replacement.

Whichever route is chosen, **manual transfer stays**. Donors inside Eritrea have
no card option and Stripe cannot charge in ERN. That is not a limitation of the
implementation; it is the reason the manual flow was rebuilt rather than retired.

---

## What each route needs from this repository

| Route | Change required |
|---|---|
| A | Set `donation-settings.provider` to **Manual transfer only**, and add the partner's donation URL to the page. Small front-end change, no schema work. |
| B or C | Put the entity's `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the environment, set `provider` to **Both**, list the card currencies, and fill in `stripeStatementDescriptor` and `stripeAccountNotice`. **No code change.** |

For B and C, `stripeAccountNotice` matters more than it looks: Stripe's page and
the donor's card statement will show the partner entity's name, not the
Eparchy's. A donor who does not recognise the name on their statement disputes
the charge, and a dispute costs the fee plus the gift.

---

## Sources

- [Stripe global availability](https://stripe.com/global) — supported-country list
- [Stripe supported countries 2026 and alternatives](https://dodopayments.com/blogs/stripe-supported-countries-alternatives) — Eritrea listed unsupported
- [Stripe test mode](https://stripe.com/docs/test-mode) and [Activate your account](https://stripe.com/docs/account/manage) — test keys before activation
- [CNEWA — The Eritrean Catholic Church](https://cnewa.org/eastern-christian-churches/the-catholic-eastern-churches/from-the-oriental-orthodox-churches/the-eritrean-catholic-church/)
- [CNEWA — Spotlight on the Eritrean Catholic Church](https://cnewa.org/spotlight-on-the-eastern-churches-the-eritrean-catholic-church-52757/) — names Barentu, Keren, Seghenity and the partner agencies
- [FACE — Eritrean Catholic Church](https://facecharity.org/eastern-churches/eritrean-catholic-church/)
- [Eritrean Catholic Bishop visits diaspora](https://secam.org/eritrean-catholic-bishop-visits-diaspora-says-too-many-migrants-perish/) — prior US fundraising visits
- [Fiscal sponsorship overview](https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/fiscal-sponsorship-nonprofits) — National Council of Nonprofits
