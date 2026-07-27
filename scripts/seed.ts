/**
 * Sample content seed for the Eparchy of Segeneyti site.
 *
 * Populates the core collections with realistic, bilingual (English + Tigrinya)
 * sample data so the site can be viewed and tested fully populated.
 *
 * SAFE TO RE-RUN: it skips seeding if content already exists (checks the
 * parishes collection). Set FORCE_SEED=1 to seed anyway (may create duplicates).
 *
 * Run:  npx tsx scripts/seed.ts        (with DATABASE_URI etc. in the env)
 */
import sharp from 'sharp'
import { getPayload } from '../src/lib/payload/client'

// ── Lexical rich-text helper ────────────────────────────────────────────────
function rt(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text, version: 1 },
        ],
      })),
    },
  }
}

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

async function main() {
  const payload = await getPayload()
  const force = process.env.FORCE_SEED === '1'

  const existing = await payload.count({ collection: 'parishes', overrideAccess: true } as any)
  if (existing.totalDocs > 0 && !force) {
    console.log(
      `↩  Parishes already has ${existing.totalDocs} doc(s) — skipping seed (set FORCE_SEED=1 to override).`,
    )
    return
  }

  /**
   * `overrideAccess: true` skips ACCESS functions but NOT hooks, and every
   * draft-enabled collection runs `requirePublishPermission` in beforeChange.
   * With no user on the request that hook sees an anonymous caller and rejects
   * every `_status: 'published'` document with a 403 — which silently broke
   * seeding of news, events and both message collections when the permission
   * system landed. Seeding acts with full authority by definition, so give the
   * request an in-memory super-admin; the resolver grants that role the whole
   * catalogue, and nothing is written to the users table.
   */
  const SEED_USER = { id: 0, role: 'super-admin', status: 'active', collection: 'users' }

  // Helper: create at 'en', then patch the Tigrinya locale for localized fields.
  const createLocalized = async (
    collection: string,
    shared: Record<string, unknown>,
    en: Record<string, unknown>,
    ti: Record<string, unknown>,
  ) => {
    const doc = await payload.create({
      collection: collection as any,
      locale: 'en',
      overrideAccess: true,
      user: SEED_USER as any,
      data: { ...shared, ...en } as any,
    })
    if (Object.keys(ti).length) {
      await payload.update({
        collection: collection as any,
        id: doc.id,
        locale: 'ti',
        overrideAccess: true,
        user: SEED_USER as any,
        data: { ...ti, ...(shared._status ? { _status: shared._status } : {}) } as any,
      })
    }
    return doc
  }

  // ── Media (one placeholder image, reused across items) ────────────────────
  console.log('▸ media')
  const imgBuf = await sharp({
    create: { width: 1200, height: 630, channels: 3, background: { r: 122, g: 30, b: 40 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer()

  const image = await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt: 'Catholic Eparchy of Segeneyti', category: 'general', accessLevel: 'public' } as any,
    file: { data: imgBuf, mimetype: 'image/jpeg', name: 'seed-cover.jpg', size: imgBuf.length },
  })
  const IMG = image.id

  // ── Priests ───────────────────────────────────────────────────────────────
  console.log('▸ priests')
  const priest1 = await createLocalized(
    'priests',
    { slug: 'fr-tesfamariam-weldegabir', fullName: 'Fr. Tesfamariam Weldegabir', title: 'Rev. Fr.', status: 'active', photo: IMG },
    { assignment: 'Pastor, St. Mary Cathedral', bio: rt(['Fr. Tesfamariam has served the Eparchy for over twenty years in pastoral and educational ministry.']) },
    { assignment: 'ሓላፊ ሰበካ ቅድስቲ ማርያም ካቴድራል', bio: rt(['ኣቦ ተስፋማርያም ኣብ ኤፓርኪ ልዕሊ ዕስራ ዓመታት ብናይ ሰበካን ትምህርትን ኣገልግሎት ኣገልጊሎም።']) },
  )
  const priest2 = await createLocalized(
    'priests',
    { slug: 'fr-ghirmay-habte', fullName: 'Fr. Ghirmay Habte', title: 'Rev. Fr.', status: 'active', photo: IMG },
    { assignment: 'Pastor, Holy Savior Parish' },
    { assignment: 'ሓላፊ ሰበካ ቅዱስ መድሓኒ' },
  )
  await createLocalized(
    'priests',
    { slug: 'msgr-yohannes-tekle', fullName: 'Msgr. Yohannes Tekle', title: 'Msgr.', status: 'active', photo: IMG },
    { assignment: 'Vicar General of the Eparchy' },
    { assignment: 'ጠቕላሊ ወኪል ኤፓርኪ' },
  )

  // ── Parishes ────────────────────────────────────────────────────────────────
  console.log('▸ parishes')
  const parish1 = await createLocalized(
    'parishes',
    {
      slug: 'st-mary-cathedral', vicariate: 'segeneyti', region: 'Segeneyti', featuredImage: IMG,
      feastDate: '16 Nehase', pastor: priest1.id,
      contact: { phone: '+291 1 650 000', email: 'cathedral@segeneyti.org', address: 'Segeneyti, Debub Region, Eritrea' },
      massTimes: [
        { day: 'Sunday', time: '07:00', language: 'Tigrinya' },
        { day: 'Sunday', time: '09:30', language: 'Tigrinya' },
        { day: 'Wednesday', time: '06:30', language: 'Tigrinya' },
      ],
    },
    { name: 'St. Mary Cathedral', patron: 'St. Mary, Mother of God', description: rt(['The cathedral church of the Eparchy of Segeneyti and seat of the Bishop.']) },
    { name: 'ቅድስቲ ማርያም ካቴድራል', patron: 'ቅድስቲ ድንግል ማርያም', description: rt(['እታ ካቴድራላዊት ቤተ ክርስቲያን ናይ ኤፓርኪ ሰገነይትን መንበር ጳጳስን።']) },
  )
  const parish2 = await createLocalized(
    'parishes',
    {
      slug: 'holy-savior-dekemhare', vicariate: 'dekemhare', region: 'Dekemhare', featuredImage: IMG, pastor: priest2.id,
      contact: { phone: '+291 1 640 100', email: 'holysavior@segeneyti.org', address: 'Dekemhare, Eritrea' },
      massTimes: [{ day: 'Sunday', time: '08:00', language: 'Tigrinya' }],
    },
    { name: 'Holy Savior Parish', patron: 'Christ the Savior', description: rt(['A vibrant parish community serving the faithful of Dekemhare.']) },
    { name: 'ሰበካ ቅዱስ መድሓኒ', patron: 'መድሓኒ ክርስቶስ', description: rt(['ንህዝቢ ደቀምሓረ ዘገልግል ንቑሕ ሰበካ ማሕበረሰብ።']) },
  )
  await createLocalized(
    'parishes',
    { slug: 'st-michael-adi-keyih', vicariate: 'adi-keyih', region: 'Adi Keyih', featuredImage: IMG },
    { name: 'St. Michael Parish', patron: 'St. Michael the Archangel' },
    { name: 'ሰበካ ቅዱስ ሚካኤል', patron: 'ሊቀ መላእኽት ቅዱስ ሚካኤል' },
  )
  await createLocalized(
    'parishes',
    { slug: 'kidane-mihret-adi-ugri', vicariate: 'adi-ugri', region: 'Mendefera', featuredImage: IMG },
    { name: 'Kidane Mihret Parish', patron: 'Our Lady, Covenant of Mercy' },
    { name: 'ሰበካ ኪዳነ ምሕረት', patron: 'ኪዳነ ምሕረት' },
  )

  // ── Ministries ───────────────────────────────────────────────────────────────
  console.log('▸ ministries')
  const ministries: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'youth-council-segeneyti', type: 'youth-council', status: 'active', featuredImage: IMG, leader: { name: 'Michael Berhe' } },
      { name: 'Youth Council of Segeneyti', mission: 'Forming young disciples through faith, fellowship, and service.' },
      { name: 'ምኽሪ መንእሰያት ሰገነይቲ', mission: 'ንመንእሰያት ብእምነት፣ ሕብረትን ኣገልግሎትን ምስልጣን።' },
    ],
    [
      { slug: 'catechists-association', type: 'catechists', status: 'active', featuredImage: IMG },
      { name: 'Catechists Association', mission: 'Handing on the faith to the next generation.' },
      { name: 'ማሕበር ካቴኬስታት', mission: 'እምነት ናብ ዝቕጽል ወለዶ ምትሕልላፍ።' },
    ],
    [
      { slug: 'childrens-faith-formation', type: 'children', status: 'active', featuredImage: IMG },
      { name: "Children's Faith Formation", mission: 'Nurturing the faith of the youngest members of the Church.' },
      { name: 'ናይ ሕፃናት ናይ እምነት ስልጠና', mission: 'ናይ ንኣሽቱ ኣባላት ቤተ ክርስቲያን እምነት ምዅስኳስ።' },
    ],
    [
      { slug: 'scc-st-mary', type: 'small-christian-community', status: 'active', parish: parish1.id },
      { name: 'St. Mary Small Christian Communities', mission: 'Living the Gospel in neighborhood faith groups.' },
      { name: 'ንኣሽቱ ክርስቲያናዊ ማሕበራት ቅድስቲ ማርያም', mission: 'ወንጌል ኣብ ጎረባብቲ ናይ እምነት ጉጅለታት ምንባር።' },
    ],
    [
      { slug: 'caritas-segeneyti', type: 'caritas', status: 'active', featuredImage: IMG, leader: { name: 'Sr. Letebrhan' } },
      { name: 'Caritas Segeneyti', mission: 'Serving the poor and vulnerable in the name of Christ.' },
      { name: 'ካሪታስ ሰገነይቲ', mission: 'ንድኻታትን ተነቀፍትን ብስም ክርስቶስ ምግልጋል።' },
    ],
    [
      { slug: 'cathedral-choir', type: 'choir', status: 'active', parish: parish1.id },
      { name: 'Cathedral Choir', mission: 'Leading the assembly in sacred liturgical song.' },
      { name: 'መዘምራን ካቴድራል', mission: 'ንማሕበር ብቕዱስ ናይ ስርዓተ ኣምልኾ መዝሙር ምምራሕ።' },
    ],
  ]
  for (const [shared, en, ti] of ministries) await createLocalized('ministries', shared, en, ti)

  // ── News ─────────────────────────────────────────────────────────────────────
  console.log('▸ news')
  const news: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'assumption-feast-2026', category: 'eparchy', publishedAt: daysFromNow(-2), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Eparchy Celebrates the Feast of the Assumption', excerpt: 'Thousands gathered at St. Mary Cathedral to celebrate the Feast of the Assumption of the Blessed Virgin Mary.', body: rt(['The Eparchy of Segeneyti marked the Feast of the Assumption with solemn liturgies across all parishes.']) },
      { title: 'ኤፓርኪ በዓል ዕርገተ ማርያም ኣኽበረ', excerpt: 'ኣብ ቅድስቲ ማርያም ካቴድራል ኣሽሓት ህዝቢ ተኣኪቦም በዓል ዕርገተ ማርያም ኣኽበሩ።', body: rt(['ኤፓርኪ ሰገነይቲ በዓል ዕርገተ ማርያም ኣብ ኩለን ሰበካታት ብድሙቕ ስርዓተ ኣምልኾ ኣኽበረ።']) },
    ],
    [
      { slug: 'new-catechetical-program', category: 'pastoral', publishedAt: daysFromNow(-6), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'New Catechetical Program Launched', excerpt: 'A renewed catechetical curriculum has been introduced across the Eparchy.', body: rt(['The new program strengthens faith formation for children and adults alike.']) },
      { title: 'ሓድሽ ናይ ትምህርተ ክርስቶስ መደብ ተኣወጀ', excerpt: 'ኣብ ኤፓርኪ ዝተሓደሰ ናይ ትምህርተ ክርስቶስ ስርዓተ ትምህርቲ ተኣታትዩ።', body: rt(['እቲ ሓድሽ መደብ ንሕፃናትን ንዓበይትን ናይ እምነት ስልጠና የደልድል።']) },
    ],
    [
      { slug: 'bishop-visits-diaspora', category: 'eparchy', publishedAt: daysFromNow(-12), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Bishop Visits Diaspora Communities', excerpt: 'The Bishop undertook a pastoral visit to Eritrean Catholic communities abroad.', body: rt(['The visit strengthened the bonds between the Eparchy and its diaspora faithful.']) },
      { title: 'ጳጳስ ንዲያስፖራ ማሕበራት በጽሑ', excerpt: 'ጳጳስ ኣብ ወጻኢ ንዝርከቡ ኤርትራውያን ካቶሊካውያን ማሕበራት ናይ ሰበካ ምብጻሕ ገበሩ።', body: rt(['እቲ ምብጻሕ ኣብ መንጎ ኤፓርክን ናይ ዲያስፖራ ምእመናንን ዘሎ ዝምድና ኣደልደለ።']) },
    ],
    [
      { slug: 'caritas-aid-rural-parishes', category: 'social', publishedAt: daysFromNow(-20), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Caritas Distributes Aid in Rural Parishes', excerpt: 'Caritas Segeneyti reached hundreds of families with food and support.', body: rt(['The outreach reflects the Church’s commitment to the poor.']) },
      { title: 'ካሪታስ ኣብ ገጠራዊ ሰበካታት ሓገዝ ዓደለ', excerpt: 'ካሪታስ ሰገነይቲ ንኣማኢት ስድራቤታት ብምግብን ሓገዝን በጽሐ።', body: rt(['እቲ ኣገልግሎት ናይ ቤተ ክርስቲያን ንድኻታት ዘለዋ ተወፋይነት የንጸባርቕ።']) },
    ],
    [
      { slug: 'youth-pilgrimage-debre-bizen', category: 'community', publishedAt: daysFromNow(-30), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Youth Pilgrimage to Debre Bizen', excerpt: 'Young people from across the Eparchy joined a pilgrimage of prayer and reflection.', body: rt(['The pilgrimage was a time of grace and renewal for the participants.']) },
      { title: 'ናይ መንእሰያት ናብ ደብረ ቢዘን ጉዕዞ', excerpt: 'ካብ መላእ ኤፓርኪ ዝመጹ መንእሰያት ናይ ጸሎትን ኣስተንትኖን ጉዕዞ ገበሩ።', body: rt(['እቲ ጉዕዞ ንተሳተፍቲ ናይ ጸጋን ሓድሶን ግዜ ነበረ።']) },
    ],
  ]
  for (const [shared, en, ti] of news) await createLocalized('news', shared, en, ti)

  // ── Events ────────────────────────────────────────────────────────────────────
  console.log('▸ events')
  const events: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'feast-of-st-mary-2026', eventType: 'feast', startDate: daysFromNow(20), featuredImage: IMG, parish: parish1.id, _status: 'published', status: 'published' },
      { title: 'Feast of St. Mary (Filseta)', excerpt: 'Solemn celebration of the Feast of the Dormition of the Blessed Virgin Mary.', description: rt(['Join the whole Eparchy for the solemn Filseta celebration at the Cathedral.']), location: { name: 'St. Mary Cathedral', address: 'St. Mary Cathedral, Segeneyti' } },
      { title: 'በዓል ቅድስቲ ማርያም (ፍልሰታ)', excerpt: 'ድሙቕ ብዓል ፍልሰታ ናይ ቅድስቲ ድንግል ማርያም።', description: rt(['ምስ ብዘሎ ኤፓርኪ ኣብ ካቴድራል ንዝግበር ድሙቕ ብዓል ፍልሰታ ተሳተፉ።']), location: { name: 'ቅድስቲ ማርያም ካቴድራል' } },
    ],
    [
      { slug: 'youth-convention-2026', eventType: 'youth', startDate: daysFromNow(40), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Eparchial Youth Convention 2026', excerpt: 'A gathering of young Catholics for prayer, formation, and fellowship.', description: rt(['Three days of talks, workshops, and worship for the youth of the Eparchy.']), location: { name: 'Pastoral Center', address: 'Segeneyti Pastoral Center' } },
      { title: 'ኤፓርካዊ ኣኼባ መንእሰያት 2026', excerpt: 'ናይ መንእሰያት ካቶሊካውያን ንጸሎት፣ ስልጠናን ሕብረትን ምትእኽኻብ።', description: rt(['ንመንእሰያት ኤፓርኪ ሰለስተ መዓልታት ዘረባታት፣ ዎርክሾፓትን ኣምልኾን።']), location: { name: 'ናይ ሰበካ ማእከል' } },
    ],
    [
      { slug: 'easter-vigil-2026', eventType: 'liturgical', startDate: daysFromNow(-60), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Easter Vigil', excerpt: 'The great vigil of the Resurrection of the Lord.', description: rt(['The Easter Vigil was celebrated with great joy across all parishes.']) },
      { title: 'ናይ ትንሳኤ ሌሊት', excerpt: 'ዓቢ ናይ ትንሳኤ ጐይታ ሌሊት።', description: rt(['ናይ ትንሳኤ ሌሊት ኣብ ኩለን ሰበካታት ብዓቢ ሓጎስ ተኣኪቡ።']) },
    ],
    [
      { slug: 'catechist-training-2026', eventType: 'education', startDate: daysFromNow(-30), _status: 'published', status: 'published' },
      { title: 'Catechist Training Workshop', excerpt: 'Formation workshop for parish catechists.', description: rt(['Catechists from across the Eparchy gathered for renewal and training.']) },
      { title: 'ናይ ካቴኬስታት ስልጠና ዎርክሾፕ', excerpt: 'ንሰበካ ካቴኬስታት ናይ ስልጠና ዎርክሾፕ።', description: rt(['ካብ መላእ ኤፓርኪ ዝመጹ ካቴኬስታት ንሓድሶን ስልጠናን ተኣከቡ።']) },
    ],
  ]
  for (const [shared, en, ti] of events) await createLocalized('events', shared, en, ti)

  // ── The Eparch ─────────────────────────────────────────────────────────────────
  // A full sample record: identity, a life's worth of milestones at mixed date
  // precision, honours, education, tenure, a gallery and a source. The Tigrinya
  // is real text rather than transliterated placeholder, because the timeline and
  // the biography are exactly where Ge'ez line-height problems show up and lorem
  // ipsum would hide them.
  //
  // ⚠ Arrays here are NOT localized as a whole — they hold localized subfields
  // (title, location) alongside shared ones (milestoneType, date, isPublic).
  // Payload REPLACES an array wholesale on update, so patching the 'ti' locale
  // with rows that carry only the translated text wipes the dates, the types and
  // the isPublic flags of every row. The rows below are therefore merged: each
  // Tigrinya row is the English row with its text replaced. The admin UI does
  // this for you — it loads and resubmits the whole document — so this caveat is
  // specific to scripted seeding.
  console.log('▸ bishops')

  /**
   * Build the Tigrinya rows for a non-localized array holding localized
   * subfields. Two things must be carried or the patch is destructive:
   *   - the shared values (type, date, isPublic), because Payload replaces the
   *     array wholesale and anything omitted reverts to its default;
   *   - each row's `id` from the created document, because without it Payload
   *     treats every row as new, deletes the originals, and the English text
   *     goes with them.
   */
  const localizeRows = (
    rows: Array<Record<string, unknown>>,
    translations: Array<Record<string, unknown>>,
    created: Array<{ id?: unknown }> = [],
  ) => rows.map((row, i) => ({ ...row, ...(translations[i] ?? {}), id: created[i]?.id }))

  const bishopMilestones = [
    { milestoneType: 'birth', title: 'Born at Adi Keyih', date: '1968-03-19T00:00:00.000Z', datePrecision: 'year', location: 'Adi Keyih', isPublic: true },
    { milestoneType: 'minor-seminary', title: 'Entered the minor seminary', date: '1983-09-01T00:00:00.000Z', datePrecision: 'approximate', location: 'Asmara', isPublic: true },
    { milestoneType: 'major-seminary', title: 'Studies in philosophy and theology', date: '1990-09-01T00:00:00.000Z', datePrecision: 'month', endDate: '1997-06-01T00:00:00.000Z', endDatePrecision: 'year', location: 'Asmara', isPublic: true },
    { milestoneType: 'priestly-ordination', title: 'Ordained to the priesthood', date: '1998-06-14T00:00:00.000Z', datePrecision: 'exact', location: 'Segeneyti', isPublic: true },
    { milestoneType: 'pastoral-assignment', title: 'Parish priest, Adi Keyih', date: '1998-09-01T00:00:00.000Z', datePrecision: 'month', endDate: '2004-01-01T00:00:00.000Z', endDatePrecision: 'year', isPublic: true },
    { milestoneType: 'further-studies', title: 'Licentiate in Sacred Scripture, Rome', date: '2004-01-01T00:00:00.000Z', datePrecision: 'year', endDate: '2008-01-01T00:00:00.000Z', endDatePrecision: 'year', location: 'Rome', isPublic: true },
    { milestoneType: 'academic-appointment', title: 'Lecturer in Sacred Scripture', date: '2008-01-01T00:00:00.000Z', datePrecision: 'year', endDatePrecision: 'ongoing', isPublic: true },
    { milestoneType: 'curial-role', title: 'Chancellor of the Eparchy', date: '2016-01-01T00:00:00.000Z', datePrecision: 'year', endDate: '2024-01-01T00:00:00.000Z', endDatePrecision: 'year', isPublic: true },
    { milestoneType: 'episcopal-appointment', title: 'Appointed Eparch of Segeneyti', date: '2024-02-11T00:00:00.000Z', datePrecision: 'exact', isPublic: true },
    { milestoneType: 'episcopal-consecration', title: 'Episcopal consecration', date: '2024-04-06T00:00:00.000Z', datePrecision: 'exact', location: 'Asmara', isPublic: true },
    { milestoneType: 'enthronement', title: 'Enthroned as Eparch of Segeneyti', date: '2024-04-14T00:00:00.000Z', datePrecision: 'exact', location: 'Segeneyti', galleryKey: 'enthronement-2024', isPublic: true },
  ]

  const bishopMilestonesTi = [
    { title: 'ኣብ ዓዲ ቀይሕ ተወልዱ', location: 'ዓዲ ቀይሕ' },
    { title: 'ናብ ንኡስ ሰሚናርዮ ኣተዉ', location: 'ኣስመራ' },
    { title: 'ናይ ፍልስፍናን ስነ መለኮትን ትምህርቲ', location: 'ኣስመራ' },
    { title: 'ናብ ክህነት ተሸሙ', location: 'ሰገነይቲ' },
    { title: 'ኣብ ዓዲ ቀይሕ ሓላፊ ኣገልግሎት ቤተ ክርስቲያን' },
    { title: 'ተወሳኺ ትምህርቲ ኣብ ቅዱስ መጽሓፍ፣ ሮማ', location: 'ሮማ' },
    { title: 'መምህር ቅዱስ መጽሓፍ' },
    { title: 'ጸሓፊ ሃገረ ስብከት' },
    { title: 'ጳጳስ ሰገነይቲ ኮይኖም ተሸሙ' },
    { title: 'ሲመተ ጵጵስና', location: 'ኣስመራ' },
    { title: 'ኣብ መንበሮም ተቐመጡ', location: 'ሰገነይቲ' },
  ]

  const bishopHonors = [
    { name: 'Honorary Doctorate in Sacred Theology', category: 'academic', awardingBody: 'Pontifical Urban University', date: '2019-01-01T00:00:00.000Z', datePrecision: 'year', place: 'Rome', isPublic: true },
  ]
  const bishopHonorsTi = [
    { name: 'ናይ ክብሪ ዶክተሬት ብስነ መለኮት', awardingBody: 'ጳጳሳዊ ኡርባን ዩኒቨርሲቲ', place: 'ሮማ' },
  ]

  const bishopEducation = [
    { institution: 'Major Seminary of Asmara', location: 'Asmara', fieldOfStudy: 'Philosophy and Theology', startYear: 1990, endYear: 1997, isPublic: true },
    { institution: 'Pontifical Biblical Institute', location: 'Rome', fieldOfStudy: 'Sacred Scripture', degree: 'Licentiate', startYear: 2004, endYear: 2008, isPublic: true },
  ]
  const bishopEducationTi = [
    { institution: 'ዓቢ ሰሚናርዮ ኣስመራ', location: 'ኣስመራ', fieldOfStudy: 'ፍልስፍናን ስነ መለኮትን' },
    { institution: 'ጳጳሳዊ ትካል ቅዱስ መጽሓፍ', location: 'ሮማ', fieldOfStudy: 'ቅዱስ መጽሓፍ' },
  ]

  const bishopPriorities = [
    { title: 'Seminary formation', description: 'Strengthening the formation of candidates for the priesthood.', status: 'ongoing', isPublic: true },
    { title: 'Diaspora pastoral care', description: 'Sustained pastoral accompaniment of Eritrean Catholic communities abroad.', status: 'ongoing', isPublic: true },
  ]
  const bishopPrioritiesTi = [
    { title: 'ስልጠና ሰሚናርዮ', description: 'ንክህነት ዝዳለዉ ሕጹያት ስልጠና ምሕያል።' },
    { title: 'ኣብ ወጻኢ ንዘለዉ ምእመናን ኣገልግሎት', description: 'ኣብ ወጻኢ ንዝርከቡ ኤርትራውያን ካቶሊካውያን ማሕበራት ቀጻሊ ኣገልግሎት።' },
  ]

  const bishopGalleries = [
    { title: 'Enthronement, 2024', key: 'enthronement-2024', date: '2024-04-14T00:00:00.000Z', coverImage: IMG, isPublic: true, images: [{ image: IMG, caption: 'Entering the cathedral', credit: 'Eparchy of Segeneyti', isPublic: true }] },
  ]
  const bishopGalleriesTi = [
    { title: 'ኣብ መንበር ምቕማጥ፣ 2024', description: 'ስእልታት ናይታ ዕለት።' },
  ]

  const bishopLinks = [
    { url: 'https://www.vatican.va/', label: 'Announcement of appointment', linkType: 'holy-see', sourceName: 'Holy See Press Office', date: '2024-02-11T00:00:00.000Z', isPublic: true },
  ]
  const bishopLinksTi = [{ label: 'ናይ ሽመት ኣዋጅ' }]

  const bishopShared = {
    slug: 'abune-mekonnen-tesfay',
    isActive: true,
    honorific: 'abune',
    portrait: IMG,
    dateOfBirth: '1968-03-19T00:00:00.000Z',
    dateOfBirthPrecision: 'year',
    nationality: 'Eritrean',
    termStart: '2024-04-14T00:00:00.000Z',
    appointingAuthority: 'roman-pontiff',
    appointmentDate: '2024-02-11T00:00:00.000Z',
    _status: 'published',
  }
  const bishopEn = {
    fullName: 'Abune Mekonnen Tesfay',
    formalTitle: 'Eparch of the Catholic Eparchy of Segeneyti',
    motto: 'Serve one another in love',
    mottoOriginal: 'Per caritatem servite invicem',
    placeOfBirth: 'Adi Keyih, Eritrea',
    appointingAuthorityName: 'Pope Francis',
    biographySummary:
      'Abune Mekonnen Tesfay has served the Eparchy of Segeneyti since 2024. Ordained a priest in 1998, he taught sacred scripture at the major seminary and served as chancellor of the Eparchy before his appointment as Eparch.',
    milestones: bishopMilestones,
    honors: bishopHonors,
    education: bishopEducation,
    pastoralPriorities: bishopPriorities,
    galleries: bishopGalleries,
    links: bishopLinks,
  }

  const bishop = await payload.create({
    collection: 'bishops' as any,
    locale: 'en',
    overrideAccess: true,
    user: SEED_USER as any,
    data: { ...bishopShared, ...bishopEn } as any,
  })
  const bishopRows = bishop as unknown as Record<string, Array<{ id?: unknown }>>

  await payload.update({
    collection: 'bishops' as any,
    id: bishop.id,
    locale: 'ti',
    overrideAccess: true,
    user: SEED_USER as any,
    data: {
      _status: 'published',
      fullName: 'ኣቡነ መኮንን ተስፋይ',
      formalTitle: 'ጳጳስ ካቶሊካዊት ሃገረ ስብከት ሰገነይቲ',
      motto: 'ብፍቕሪ ንሓድሕድኩም ተገልገሉ',
      placeOfBirth: 'ዓዲ ቀይሕ፣ ኤርትራ',
      appointingAuthorityName: 'ር.ሊ.ጳ ፍራንቸስኮስ',
      biographySummary:
        'ኣቡነ መኮንን ተስፋይ ካብ 2024 ጀሚሮም ንሃገረ ስብከት ሰገነይቲ የገልግሉ ኣለዉ። ኣብ 1998 ካህን ኮይኖም ተሸሙ፣ ኣብ ዓቢ ሰሚናርዮ ቅዱስ መጽሓፍ መሃሩ፣ ቅድሚ ናብ ጵጵስና ምስያሞም ድማ ጸሓፊ ሃገረ ስብከት ኮይኖም ኣገልጊሎም።',
      milestones: localizeRows(bishopMilestones, bishopMilestonesTi, bishopRows.milestones),
      honors: localizeRows(bishopHonors, bishopHonorsTi, bishopRows.honors),
      education: localizeRows(bishopEducation, bishopEducationTi, bishopRows.education),
      pastoralPriorities: localizeRows(bishopPriorities, bishopPrioritiesTi, bishopRows.pastoralPriorities),
      galleries: localizeRows(bishopGalleries, bishopGalleriesTi, bishopRows.galleries),
      links: localizeRows(bishopLinks, bishopLinksTi, bishopRows.links),
    } as any,
  })

  // ── Bishop messages ────────────────────────────────────────────────────────────
  console.log('▸ bishop-messages')
  const bishopMsgs: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'christmas-message-2025', messageType: 'christmas', publishedAt: daysFromNow(-40), featuredImage: IMG, isFeatured: true, _status: 'published', status: 'published' },
      { title: 'Christmas Message 2025', excerpt: 'A reflection on the mystery of the Incarnation for the faithful of the Eparchy.', body: rt(['Dear brothers and sisters, at Christmas we celebrate God who draws near to us in the Child of Bethlehem.']) },
      { title: 'ናይ ልደት መልእኽቲ 2025', excerpt: 'ንምእመናን ኤፓርኪ ብዛዕባ ምስጢረ ስጋዌ ዝግበር ኣስተንትኖ።', body: rt(['ፍቁራት ኣሕዋትን ኣሓትን፣ ኣብ በዓል ልደት ነቲ ኣብ ህጻን ቤተልሔም ናባና ዝቐረበ ኣምላኽ ነኽብር።']) },
    ],
    [
      { slug: 'pastoral-letter-family-life', messageType: 'pastoral-letter', publishedAt: daysFromNow(-90), featuredImage: IMG, _status: 'published', status: 'published' },
      { title: 'Pastoral Letter on Family Life', excerpt: 'On the vocation and mission of the Christian family today.', body: rt(['The family is the domestic church, the first place where faith is lived and handed on.']) },
      { title: 'ብዛዕባ ናይ ስድራቤት ህይወት ናይ ሰበካ ደብዳቤ', excerpt: 'ብዛዕባ ናይ ሎሚ ክርስቲያናዊት ስድራቤት ጽውዓን ተልእኾን።', body: rt(['ስድራቤት ናይ ገዛ ቤተ ክርስቲያን፣ እምነት ዝንበረሉን ዝመሓላለፈሉን ቀዳማይ ቦታ እያ።']) },
    ],
    [
      { slug: 'homily-assumption', messageType: 'homily', publishedAt: daysFromNow(-3), _status: 'published', status: 'published' },
      { title: 'Homily for the Feast of the Assumption', excerpt: 'Mary, assumed into heaven, is the sign of our sure hope.', body: rt(['In Mary’s Assumption we see the destiny to which all the faithful are called.']) },
      { title: 'ናይ ዕርገተ ማርያም በዓል ስብከት', excerpt: 'ማርያም፣ ናብ ሰማይ ዝዓረገት፣ ናይ ርግጸኛ ተስፋና ምልክት እያ።', body: rt(['ኣብ ዕርገተ ማርያም ኩሎም ምእመናን ዝጽውዑሉ ዕድል ንርኢ።']) },
    ],
  ]
  // Attribution is a relationship: the byline and the link to his profile both
  // resolve from the one bishop record rather than a copied author name.
  for (const [shared, en, ti] of bishopMsgs)
    await createLocalized('bishop-messages', { ...shared, bishop: bishop.id }, en, ti)

  // ── Pope messages ──────────────────────────────────────────────────────────────
  console.log('▸ pope-messages')
  const popeMsgs: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'fratelli-tutti', documentType: 'encyclical', publishedAt: daysFromNow(-200), featuredImage: IMG, sourceUrl: 'https://www.vatican.va', _status: 'published', status: 'published' },
      { title: 'Fratelli Tutti — On Fraternity and Social Friendship', excerpt: 'The Holy Father’s encyclical on human fraternity and social friendship.', body: rt(['An invitation to build a more fraternal and just world across all peoples.']) },
      { title: 'ፍራተሊ ቱቲ — ብዛዕባ ሕውነትን ማሕበራዊ ዕርክነትን', excerpt: 'ናይ ቅዱስ ኣቦ ብዛዕባ ናይ ሰብ ሕውነትን ማሕበራዊ ዕርክነትን ዝኾነ ኤንሳይክሊካ።', body: rt(['ኣብ መንጎ ኩሎም ህዝብታት ዝያዳ ሕውነታውን ፍትሓውን ዓለም ንምህናጽ ዝግበር ዕድመ።']) },
    ],
    [
      { slug: 'world-day-of-peace-message', documentType: 'message', publishedAt: daysFromNow(-150), sourceUrl: 'https://www.vatican.va', _status: 'published', status: 'published' },
      { title: 'Message for the World Day of Peace', excerpt: 'The Holy Father’s annual message calling the world to peace.', body: rt(['Peace is both a gift of God and a task entrusted to every person of good will.']) },
      { title: 'ንዓለምለኻዊ መዓልቲ ሰላም መልእኽቲ', excerpt: 'ናይ ቅዱስ ኣቦ ንዓለም ናብ ሰላም ዝጽውዕ ዓመታዊ መልእኽቲ።', body: rt(['ሰላም ናይ ኣምላኽ ህያብን ንነፍሲ ወከፍ ሰናይ ፍቓድ ዘለዎ ሰብ ዝተውሃበ ዕዮን እዩ።']) },
    ],
  ]
  for (const [shared, en, ti] of popeMsgs) await createLocalized('pope-messages', shared, en, ti)

  // ── Ge'ez calendar entries ──────────────────────────────────────────────────────
  console.log('▸ geez-calendar-entries')
  const geez: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'buhe-transfiguration', isFasting: false, feastRank: 'major', liturgicalColor: 'gold', geezDate: { month: 'hamle', day: 13 }, gregorianEquivalent: { month: 8, day: 19 } },
      { title: 'Feast of the Transfiguration (Buhe)', saint: 'The Transfiguration of the Lord', description: rt(['One of the great feasts of the Lord, celebrated with the traditional Buhe customs.']) },
      { title: 'በዓል ደብረ ታቦር (ቡሄ)', saint: 'ደብረ ታቦር ናይ ጐይታ', description: rt(['ካብ ዓበይቲ በዓላት ጐይታ ሓደ፣ ብባህላዊ ናይ ቡሄ ልምድታት ዝኽበር።']) },
    ],
    [
      { slug: 'filseta-st-mary', isFasting: false, feastRank: 'major', liturgicalColor: 'white', geezDate: { month: 'nehase', day: 16 }, gregorianEquivalent: { month: 8, day: 22 } },
      { title: 'Feast of St. Mary (Filseta)', saint: 'The Dormition of the Blessed Virgin Mary' },
      { title: 'በዓል ቅድስቲ ማርያም (ፍልሰታ)', saint: 'ዕረፍተ ቅድስቲ ድንግል ማርያም' },
    ],
    [
      { slug: 'fast-of-the-apostles', isFasting: true, feastRank: 'fasting', liturgicalColor: 'purple', geezDate: { month: 'sene', day: 1 } },
      { title: 'Fast of the Apostles', saint: 'The Holy Apostles', fastingNotes: 'A penitential fasting season in preparation for the feast of the Apostles.' },
      { title: 'ጾመ ሃዋርያት', saint: 'ቅዱሳን ሃዋርያት', fastingNotes: 'ንበዓል ሃዋርያት መዳለዊ ናይ ንስሓ ጾም ወቕቲ።' },
    ],
    [
      { slug: 'meskel-finding-cross', isFasting: false, feastRank: 'major', liturgicalColor: 'gold', geezDate: { month: 'meskerem', day: 17 }, gregorianEquivalent: { month: 9, day: 27 } },
      { title: 'Meskel — Finding of the True Cross', saint: 'The Holy Cross' },
      { title: 'መስቀል — ምርካብ ሓቀኛ መስቀል', saint: 'ቅዱስ መስቀል' },
    ],
    [
      { slug: 'ldet-nativity', isFasting: false, feastRank: 'major', liturgicalColor: 'white', geezDate: { month: 'tahsas', day: 29 }, gregorianEquivalent: { month: 1, day: 7 } },
      { title: 'Nativity of the Lord (Ldet)', saint: 'The Birth of Christ' },
      { title: 'ልደተ እግዚእ (ልደት)', saint: 'ልደት ክርስቶስ' },
    ],
  ]
  for (const [shared, en, ti] of geez) await createLocalized('geez-calendar-entries', shared, en, ti)

  // ── Publications (file uses the placeholder media) ─────────────────────────────
  console.log('▸ publications')
  const pubs: Array<[Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
    [
      { slug: 'catechism-for-families', category: 'educational', language: 'ti', publishedAt: daysFromNow(-100), coverImage: IMG, file: IMG, pageCount: 64, isFeatured: false },
      { title: 'Catechism for Families', description: 'A practical guide for handing on the faith at home.' },
      { title: 'ትምህርተ ክርስቶስ ንስድራቤታት', description: 'ኣብ ገዛ እምነት ንምትሕልላፍ ግብራዊ መምርሒ።' },
    ],
    [
      { slug: 'diocesan-prayer-book', category: 'prayer', language: 'ti', publishedAt: daysFromNow(-250), coverImage: IMG, file: IMG, pageCount: 120, isFeatured: true },
      { title: 'Diocesan Prayer Book', description: 'Prayers, hymns, and devotions for the faithful of the Eparchy.' },
      { title: 'ናይ ሃገረ ስብከት መጽሓፍ ጸሎት', description: 'ንምእመናን ኤፓርኪ ጸሎታት፣ መዝሙራትን ኣምልኾታትን።' },
    ],
  ]
  for (const [shared, en, ti] of pubs) await createLocalized('publications', shared, en, ti)

  // ── Homepage global (hero + section headings) ─────────────────────────────────
  console.log('▸ homepage global')
  await payload.updateGlobal({
    slug: 'homepage',
    locale: 'en',
    overrideAccess: true,
    data: {
      hero: {
        headline: 'Catholic Eparchy of Segeneyti',
        subheading: 'Serving God’s people through faith, community, and mission in Eritrea.',
        backgroundImage: IMG,
        primaryCta: { label: 'Explore Parishes', url: '/parishes' },
        secondaryCta: { label: 'Latest News', url: '/news' },
      },
      bishopMessage: { enabled: true, sectionHeading: 'A Word from the Bishop' },
      latestNews: { enabled: true, sectionHeading: 'Latest News', count: 3 },
      upcomingEvents: { enabled: true, sectionHeading: 'Upcoming Events', count: 3 },
      quickLinks: { enabled: true, sectionHeading: 'Quick Links' },
    } as any,
  })
  await payload.updateGlobal({
    slug: 'homepage',
    locale: 'ti',
    overrideAccess: true,
    data: {
      hero: {
        headline: 'ካቶሊካዊ ኤፓርኪ ሰገነይቲ',
        subheading: 'ንሕዝቢ ኣምላኽ ብእምነት፣ ሕብረተሰብን ተልእኾን ኣብ ኤርትራ ምግልጋል።',
        primaryCta: { label: 'ሰበካታት ርአ' },
        secondaryCta: { label: 'ዝቐረቡ ዜናታት' },
      },
      bishopMessage: { sectionHeading: 'ቃል ካብ ጳጳስ' },
      latestNews: { sectionHeading: 'ዝቐረቡ ዜናታት' },
      upcomingEvents: { sectionHeading: 'ዝቐርቡ ኣጋጣሚታት' },
      quickLinks: { sectionHeading: 'ቅልጡፍ መላግቦታት' },
    } as any,
  })

  console.log('\n✅ Seed complete. Content created across parishes, priests, ministries, news, events, bishop & pope messages, Ge’ez calendar, publications, and the homepage.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
