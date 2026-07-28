# Tigrinya review — donation strings

**Status: drafted by an AI assistant, NOT yet verified by a native speaker.**

69 new strings were added to `messages/ti.json` for the Stripe and manual-transfer
donation flow. They follow the register already used in that file — polite plural
(`-ኹም` / `-ኩም`) throughout, matching the existing donate and contact copy.

Please review before card donations go live. Rows in **bold** are the
money-critical ones: they tell a donor what will be charged, what to transfer, or
whether their gift has actually gone through. A nuance that is merely awkward
elsewhere is a real problem in those.

Placeholders in braces (`{amount}`, `{name}`, `{reference}`, `{currency}`,
`{currencies}`, `{value}`) are substituted at runtime and **must be preserved
exactly**, including the braces. The surrounding word order may change freely.

To correct a string, edit `messages/ti.json` — nothing else needs to change, and
`npm test` verifies that both catalogues still hold the same keys.

## Specific things worth a second opinion

- **"መወከሲ ኮድ" for "reference code".** This is the single most important term in
  the manual flow: it is what a donor writes on a bank transfer slip so the
  treasurer can match the payment. If a clearer or more customary banking term
  exists in Eritrean usage, that matters more than literal fidelity.
- **"ናይ ባንክ ምትሕልላፍ" for "bank transfer".** Check this is the phrase people
  actually use for sending money, rather than a general "transfer".
- **"መብጽዓ" for a pledge** — a promise to give that is not yet fulfilled. The
  distinction between a pledge and a completed gift carries the whole design of
  the manual flow, so if this word does not make that distinction clearly to a
  reader, it should change.
- **`confirmingBody`** must not read as a thank-you. It says the payment is being
  confirmed, not that it has succeeded.
- **`cancelledBody` / `failedBody`** must be unambiguous that **no money was
  taken**, and should not sound like an accusation of failure on the donor's part.
- **`email.greeting`** uses `ዝኸበርኩም {name}፡` — plural and gender-neutral, since
  we never know a donor's gender. Please confirm that reads naturally as a
  salutation to one person.
- Bank and card terms (`SWIFT / BIC`, `Stripe`, `Visa`, `ማስተርካርድ`) are left in
  Latin script or transliterated. Adjust if the Tigrinya convention differs.

## All new strings

| Key | English | Tigrinya (draft) |
|---|---|---|
| `methodTitle` | How would you like to give? | ብኸመይ ክትውፍዩ ትደልዩ? |
| `methodManual` | Bank transfer | ናይ ባንክ ምትሕልላፍ |
| `methodManualHint` | Available everywhere, including inside Eritrea. You make the transfer and we record your gift against a reference code. | ኣብ ውሽጢ ኤርትራ ሓዊሱ ኣብ ኩሉ ቦታ ይሰርሕ። ንስኹም ገንዘብ ተመሓላልፉ፡ ንሕና ድማ ብመወከሲ ኮድ ወፈያኹም ንምዝግቦ። |
| `methodCard` | Card | ብካርድ |
| `methodCardHint` | Visa, Mastercard and others. Handled on a secure page hosted by Stripe — we never see your card details. | ቪዛ፡ ማስተርካርድን ካልኦትን። ብStripe ኣብ ዝተሓለወ ገጽ ይፍጸም — ንሕና ንዝርዝር ካርድኹም ኣይንርእዮን። |
| `methodCardUnavailableTitle` | Card payment is not available for this gift | ነዚ ወፈያ ብካርድ ምኽፋል ኣይከኣልን |
| **`cardNotForCurrency`** | Cards cannot be charged in {currency}. Choose {currencies} to give by card, or continue with a bank transfer. | ብ{currency} ብካርድ ክኽፈል ኣይክእልን። ብካርድ ንምውፋይ {currencies} ምረጹ፡ ወይ ብናይ ባንክ ምትሕልላፍ ቀጽሉ። |
| `continueToCard` | Continue to secure payment | ናብ ዝተሓለወ ክፍሊት ቀጽሉ |
| `redirecting` | Taking you to the secure payment page… | ናብ ዝተሓለወ ናይ ክፍሊት ገጽ ንመርሓኩም ኣለና… |
| **`cardSecurityNote`** | You will be taken to Stripe to enter your card details. Your card number is never sent to this website. | ዝርዝር ካርድኹም ንምእታው ናብ Stripe ክትውሰዱ ኢኹም። ቁጽሪ ካርድኹም ናብዚ መርበብ ሓበሬታ ፈጺሙ ኣይለኣኽን። |
| `pledgeTitle` | Almost there — your gift is not complete yet | ቀሪብኩም ኢኹም — ወፈያኹም ገና ኣይተዛዘመን |
| **`pledgeIntro`** | We have recorded your pledge of {amount}. To complete it, make the transfer below and quote your reference code so we can match it to you. | ናይ {amount} መብጽዓኹም መዝጊብናዮ ኣለና። ንምዝዛሙ፡ ኣብ ታሕቲ ዘሎ ምትሕልላፍ ፈጽሙ፡ ምሳኹም ከነተሓሕዞ ድማ መወከሲ ኮድኩም ጥቐሱ። |
| **`referenceCode`** | Reference code | መወከሲ ኮድ |
| **`referenceHint`** | Write this code in the transfer reference or memo field. It is how we match your transfer to your gift. | ነዚ ኮድ ኣብ ናይ ምትሕልላፍ መወከሲ ወይ መዘክር ጽሓፍዎ። ምትሕልላፍኩም ምስ ወፈያኹም እነተሓሕዘሉ መገዲ እዩ። |
| `transferStepsTitle` | Transfer details | ዝርዝር ምትሕልላፍ |
| `transferAccountHolder` | Account name | ሽም ሕሳብ |
| `transferBank` | Bank | ባንክ |
| **`transferAccountNumber`** | Account number | ቁጽሪ ሕሳብ |
| `transferSwift` | SWIFT / BIC | SWIFT / BIC |
| **`transferAmount`** | Amount to transfer | ዝመሓላለፍ መጠን |
| **`transferNoDetails`** | Transfer details have not been published yet. Please contact the Eparchy chancery and quote your reference code, and we will tell you how to send your gift. | ዝርዝር ምትሕልላፍ ገና ኣይተሓትመን። በጃኹም ንቻንስለሪ ኤጳርቅ ተወከሱ፡ መወከሲ ኮድኩም ጥቐሱ፡ ንሕና ድማ ወፈያኹም ብኸመይ ከም እትልእኹ ክንሕብረኩም ኢና። |
| `pledgeEmailed` | We have also emailed these details to you. | እዚ ዝርዝር ብኢመይል እውን ልኢኽናልኩም ኣለና። |
| `printPage` | Print or save this page | ነዚ ገጽ ሓትሙ ወይ ኣቐምጡ |
| `giveAgain` | Make another gift | ካልእ ወፈያ ግበሩ |
| `confirmingTitle` | Confirming your gift | ወፈያኹም ይረጋገጽ ኣሎ |
| **`confirmingBody`** | Your payment went through and we are waiting for final confirmation from our payment provider. This usually takes a few seconds. You can safely close this page — your receipt will be emailed to you. | ክፍሊትኩም ሓሊፉ ኣሎ፡ ካብ ወሃቢ ኣገልግሎት ክፍሊትና ናይ መወዳእታ መረጋገጺ ንጽበ ኣለና። መብዛሕትኡ ግዜ ውሑዳት ካልኢታት እዩ ዝወስድ። ነዚ ገጽ ብዘይ ስክፍታ ክትዓጽውዎ ትኽእሉ ኢኹም — ቅብሊትኩም ብኢመይል ክለኣኸልኩም እዩ። |
| `checkAgain` | Check again | ደጊምኩም ኣረጋግጹ |
| `succeededTitle` | Thank you — your gift is confirmed | የቐንየልና — ወፈያኹም ተረጋጊጹ |
| **`succeededBody`** | We have received your gift of {amount}. A receipt is on its way to your email. | ናይ {amount} ወፈያኹም ተቐቢልናዮ ኣለና። ቅብሊት ናብ ኢመይልኩም ይመጽእ ኣሎ። |
| `failedTitle` | Payment was not completed | ክፍሊት ኣይተዛዘመን |
| **`failedBody`** | Your card was not charged. You are welcome to try again, or to give by bank transfer instead. | ካብ ካርድኹም ገንዘብ ኣይተወስደን። ደጊምኩም ክትፍትኑ፡ ወይ ብናይ ባንክ ምትሕልላፍ ክትውፍዩ ትኽእሉ ኢኹም። |
| `refundedTitle` | This gift was refunded | እዚ ወፈያ ተመሊሱ እዩ |
| **`refundedBody`** | This donation of {amount} has been refunded. If you were not expecting this, please contact us. | እዚ ናይ {amount} ወፈያ ተመሊሱ እዩ። እዚ ትጽበይዎ እንተዘይነይርኩም፡ በጃኹም ተወከሱና። |
| `disputedTitle` | This gift is under review | እዚ ወፈያ ኣብ ትሕቲ መጽናዕቲ ኣሎ |
| `disputedBody` | Your bank has raised a query about this payment. Please contact us if you need help. | ባንክኹም ብዛዕባ እዚ ክፍሊት ሕቶ ኣልዒሉ ኣሎ። ሓገዝ እንተደሊኹም በጃኹም ተወከሱና። |
| `cancelledTitle` | Payment cancelled | ክፍሊት ተሰሪዙ |
| **`cancelledBody`** | You cancelled before paying, so nothing was charged. You are very welcome to try again. | ቅድሚ ምኽፋልኩም ስለ ዝሰረዝኩም፡ ገለ እኳ ኣይተኸፍለን። ደጊምኩም ክትፍትኑ ብልቢ ንዕድመኩም። |
| `tryAgain` | Try again | ደጊምኩም ፈትኑ |
| `notFoundTitle` | We could not find that donation | ነቲ ወፈያ ክንረኽቦ ኣይከኣልናን |
| `notFoundBody` | The link may be incomplete or the record may have been removed. Please contact us if you believe a gift was taken. | እቲ መላግቦ ዘይተማልአ ክኸውን ይኽእል፡ ወይ እቲ መዝገብ ተኣልዩ ክኸውን ይኽእል። ገንዘብ ተወሲዱ ኢልኩም እንተ ኣሚንኩም በጃኹም ተወከሱና። |
| **`testModeNotice`** | Test mode — no real payment will be taken. | ናይ ፈተነ መስርሕ — ናይ ሓቂ ክፍሊት ኣይውሰድን። |
| **`errors.nameRequired`** | Please enter your name. | በጃኹም ሽምኩም ኣእትዉ። |
| **`errors.emailInvalid`** | Please enter a valid email address. | በጃኹም ቅኑዕ ኢመይል ኣእትዉ። |
| **`errors.messageTooLong`** | Your message is too long. | መልእኽትኹም ኣዝዩ ነዊሕ እዩ። |
| **`errors.currencyInvalid`** | Please choose a valid currency. | በጃኹም ቅኑዕ ባጤራ ምረጹ። |
| **`errors.recurringUnavailable`** | Monthly giving is not available for this payment method. | ወርሓዊ ወፈያ ነዚ ናይ ክፍሊት ኣገባብ ኣይርከብን። |
| **`errors.donationsDisabled`** | Donations are not currently being accepted. Please check back soon. | ሕጂ ወፈያ ኣይንቕበልን ኣለና። በጃኹም ድሒርኩም ተመለሱ። |
| **`errors.methodUnavailable`** | That payment method is not available right now. | እቲ ናይ ክፍሊት ኣገባብ ሕጂ ኣይርከብን። |
| **`errors.cardCurrencyUnsupported`** | Cards cannot be charged in the currency you chose. Please choose another currency or give by bank transfer. | ብዝመረጽኩምዎ ባጤራ ብካርድ ክኽፈል ኣይክእልን። በጃኹም ካልእ ባጤራ ምረጹ፡ ወይ ብናይ ባንክ ምትሕልላፍ ውፈዩ። |
| **`errors.amountBelowMin`** | The minimum gift is {value}. | ዝወሓደ ወፈያ {value} እዩ። |
| **`errors.amountAboveMax`** | The maximum gift is {value}. | ዝለዓለ ወፈያ {value} እዩ። |
| **`errors.amountInvalid`** | Please enter a gift amount greater than zero. | በጃኹም ካብ ባዶ ዝዓበየ መጠን ወፈያ ኣእትዉ። |
| **`errors.checkoutFailed`** | We could not start the card payment. Please try again, or give by bank transfer. | ናይ ካርድ ክፍሊት ክንጅምር ኣይከኣልናን። በጃኹም ደጊምኩም ፈትኑ፡ ወይ ብናይ ባንክ ምትሕልላፍ ውፈዩ። |
| **`errors.generic`** | Sorry, we could not record your donation. Please try again later. | ይቕሬታ፡ ወፈያኹም ክንምዝግቦ ኣይከኣልናን። በጃኹም ደጊምኩም ፈትኑ። |
| **`email.receiptSubject`** | Thank you for your donation — Eparchy of Segheneyti | ስለ ወፈያኹም የቐንየልና — ኤጳርቅ ሠገነይቲ |
| **`email.pledgeSubject`** | How to complete your donation — Eparchy of Segheneyti | ወፈያኹም ብኸመይ ከም እትውድእዎ — ኤጳርቅ ሠገነይቲ |
| **`email.refundSubject`** | Your donation has been refunded — Eparchy of Segheneyti | ወፈያኹም ተመሊሱ ኣሎ — ኤጳርቅ ሠገነይቲ |
| **`email.greeting`** | Dear {name}, | ዝኸበርኩም {name}፡ |
| **`email.receiptBody`** | Thank you for your generous gift of {amount} to the Catholic Eparchy of Segheneyti. Your payment has been confirmed. | ናብ ካቶሊካዊ ኤጳርቅ ሠገነይቲ ብዘወፈኹምዎ ልግሲ ዝመልኦ {amount} የቐንየልና። ክፍሊትኩም ተረጋጊጹ ኣሎ። |
| **`email.pledgeBody`** | Thank you for pledging {amount} to the Catholic Eparchy of Segheneyti. Your gift is not complete until your transfer reaches us. | ናብ ካቶሊካዊ ኤጳርቅ ሠገነይቲ {amount} ንምውፋይ ስለ ዝመብጻዕኩም የቐንየልና። ምትሕልላፍኩም ክሳብ ዝበጽሓና ወፈያኹም ኣይተዛዘመን። |
| **`email.pledgeAction`** | Please make the transfer using the details below, and quote your reference code so we can match it to your gift. | በጃኹም ኣብ ታሕቲ ዘሎ ዝርዝር ተጠቒምኩም ኣመሓላልፉ፡ ምስ ወፈያኹም ከነተሓሕዞ ድማ መወከሲ ኮድኩም ጥቐሱ። |
| **`email.referenceLine`** | Reference code: {reference} | መወከሲ ኮድ፦ {reference} |
| **`email.refundBody`** | Your donation of {amount} has been refunded. If you were not expecting this, please contact us. | ናይ {amount} ወፈያኹም ተመሊሱ ኣሎ። እዚ ትጽበይዎ እንተዘይነይርኩም፡ በጃኹም ተወከሱና። |
| **`email.blessing`** | May God bless you for your support. | ስለ ደገፍኩም እግዚኣብሔር ይባርኽኩም። |
| **`email.signature`** | Catholic Eparchy of Segheneyti | ካቶሊካዊ ኤጳርቅ ሠገነይቲ |
| **`email.notifySubject`** | New donation: {amount} ({method}) | ሓድሽ ወፈያ፦ {amount} ({method}) |
| **`email.notifyPending`** | A new pledge was recorded and is awaiting a bank transfer. | ሓድሽ መብጽዓ ተመዝጊቡ፡ ናይ ባንክ ምትሕልላፍ ይጽበ ኣሎ። |
| **`email.notifySucceeded`** | A card donation was confirmed by Stripe. | ናይ ካርድ ወፈያ ብStripe ተረጋጊጹ። |
| **`email.viewInAdmin`** | Open in the admin panel | ኣብ ናይ ምምሕዳር ክፍሊ ክፈት |
