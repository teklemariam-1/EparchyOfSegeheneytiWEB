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
      data: { ...shared, ...en } as any,
    })
    if (Object.keys(ti).length) {
      await payload.update({
        collection: collection as any,
        id: doc.id,
        locale: 'ti',
        overrideAccess: true,
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
  for (const [shared, en, ti] of bishopMsgs) await createLocalized('bishop-messages', shared, en, ti)

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
