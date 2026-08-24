import type { ClergyObituary } from '@/types/payload-types'
import { lexicalFromText } from '@/lib/payload/lexical'

/**
 * ቀሺ ዑቕባገብርኤል ወልደማርያም (1931–2026) — the document this feature was built
 * from, in the collection's real shape. Tests only; never seeded.
 *
 * TODO chancery to confirm the exact death date; the funeral was 15 Aug 2026.
 * NOTE the source text lists the 1993 assignment before 1992 — verify with the
 * chancery; sortDate keeps them chronological here.
 */
export const fixtureUkbagebriel: ClergyObituary = {
  id: 1,
  honorific: 'ቀሺ',
  fullName: 'ዑቕባገብርኤል ቀሺ ወልደማርያም',
  photo: 1,
  birthDate: '1931-05-27',
  birthPlace: 'ዓዲጣል',
  fatherName: 'ቀሺ ወልደማርያም ተኽለ',
  motherName: 'ወ/ሮ ግደይ ገብረንጉስ',

  deathDate: '2026-08-14',
  ageAtDeath: 95,
  openingParagraph: lexicalFromText(
    'ሎሚ ኣብ ዘመነ ፍልሰታ፡ ነዞም ኣብዛ ምድሪ’ዚኣ ብ"ሠናይ ገድሊ" ዝተጋደሉ፡ ልኡኽ እግዚኣብሔር ዝኾኑ፡ ኣቦና ቀሺ ዑቕባገብርኤል ወልደማርያም ካብዛ ታህዋኽን ሸበድበድን ዝመልኣ ምድሪ፡ ኣብ መበል 95 ዕድመኦም ነፋንዎም ኣሎና።',
  ),

  isMarried: true,
  marriage: {
    marriageDate: '1952-11-17',
    spouseName: 'ወ/ሮ ግደይ ካሕሳይ',
    spouseDeceased: true,
  },

  ordination: {
    date: '1957-04-11',
    bishop: 'ኣቡነ ማርቆስ ጳጳስ ኦርቶዶክስ ቤተክርስትያን',
    place: 'ኣስመራ',
    church: 'orthodox',
  },
  fullCommunion: { year: 1977, authorizingBishop: 'ብጹዕ ኣቡነ ኣብርሃ ፍራንሱዋ' },

  assignments: [
    { sortDate: '1978-01-01', periodDisplay: 'ካብ 1978-1979', role: 'ምክትል ቆሞስ', parishName: 'ደብረ ፋጥማ ማርያም', place: 'ዓድውብዑር' },
    { sortDate: '1979-02-15', periodDisplay: 'ብ15 የካቲት 1979 ክሳብ 1984', role: 'ቆሞስ', parishName: 'ደብረ መድሓኔ ዓለም', place: 'በራቒት ንእሽቶ' },
    { sortDate: '1984-01-01', periodDisplay: 'ካብ 1984-1985', role: 'ኣገልጋሊ', parishName: 'ድግሳ ማርያም ጽዮን' },
    {
      sortDate: '1985-01-01', periodDisplay: 'ብ1985', role: 'ቆሞስ', parishName: 'ደብረ መድሓኔ ዓለም', place: 'በራቒት ንእሽቶ',
      achievements: [{ text: 'ብ1987 ነዛ ንእሽቶን ንጸሎት ምችእትን ቤተክርስትያን ክሃንጹ ጀሚሮም ብረዲኤት መድሓኔ ዓለም ዛዚሞማ።' }],
    },
    {
      sortDate: '1992-09-11', periodDisplay: 'ብ11 መስከረም 1992ፈ', role: 'ቆሞስ', parishName: 'ደብረ ቅዱስ ሚካኤል ሓላይን ኪዳነ ምሕረት ዓድሽዓድን',
      achievements: [{ text: 'ብግዚኦም 6ተ ክፍሊ ዘለዎ መንበሪ ቆሞስ ሰሪሖም።' }],
    },
    {
      sortDate: '1993-09-20', periodDisplay: 'ብ20 መስከረም 1993ፈ', role: 'ቆሞስ', parishName: 'ኣውህነን መዓርዳን',
      achievements: [{ text: 'ንቁምስና ቤተክርስትያን ደብረ ቅዱስ ጊዮርጊስ መዓርዳ ኣሓዲሶም።' }],
    },
    {
      sortDate: '2003-01-30', periodDisplay: 'ብ30 ጥሪ 2003ፈ', role: 'ቆሞስ', parishName: 'ደብረ ቅዱስ ሚካኤል ሓድሽ ዓዲ ሓደግቲ',
      achievements: [{ text: 'ንቁምስናታት ደብረ ኪዳነ ምሕረት ዓዲቀይሕ የገልግሉ ኔሮም።' }],
    },
    { sortDate: '2010-01-01', periodDisplay: 'ብ2010ፈ', role: 'ንዕረፍቲ', parishName: 'ደብረ መድሓኔ ዓለም', place: 'ዓዲቀይሕ' },
  ],

  retirementYear: 2010,
  retirementPlace: 'ደብረ መድሓኔ ዓለም ዓዲቀይሕ',

  characterVerse: { reference: 'ምሳሌ 14፥14', text: 'ሕያዎት ሰባት ከም ግብሮም ዓስቦም ክስዕቦም እዩ' },
  characterSummary: lexicalFromText('ብሕጽር ዝበለ እተን ብጹዓን ነዳያን ዝብላ 8ተ ብጽዕነታት ኣብ ሕይወቶም ዘንጸባርቓ ኢየን።'),
  virtues: [
    { text: 'ብሓቂ ለዋህ ኣቦ' },
    { text: 'ቦቕባቕ ኣቦ' },
    { text: 'ምልክት ሕያውነትን ትሕትናን' },
    { text: 'ምስ ኩሉ ብሰላም ዝነብሩ' },
    { text: 'ትጉህ ኖላዊ ብእሴ እግዚኣብሔር ዝነበሩ ኣቦ' },
  ],
  scriptureReflections: [
    { reference: 'ዮሓ 12፥26', text: 'እቲ ዘገልግለኒ ዘበለ፡ ኣብቲ ኣነ ዘለኹዎ ክህሉ ኢዩ' },
    { reference: 'ራእ 14፥13', text: 'እቶም ካብ ሕጂ ብጐይታ ዚሞቱ ብፁዓን እዮም፥ እወ፥ ግብሮም ኪስዕቦም እዩ እሞ ካብ ጻዕሮም ኬዕርፉ እዮም' },
  ],
  hopeStatement: lexicalFromText(
    'ናይቶም ለዋሃት ሰባት ዓስቢ፡ ርስቲ ቅዱሳን፡ ሰማያዊ ሓጎስ፡ ዓይኒ ዘይረኣየቶ፡ እዝኒ ዘይሰማዓቶ፡ ልቢ ዘይሓለኖ ሰማያዊ ዓስቢ ከም ዝስዕቦም እምነትናን ተስፋናን ኢዩ።',
  ),

  funeralDate: '2026-08-15',
  presidingBishop: 'ብጹዕ ኣቡነ ፍቕረማርያም ሓጎስ ጳጳስ ሰበኻ ሰገነይቲ',
  funeralDescription: lexicalFromText(
    'ዓበይቲ ካህናት ብጾቶምን ነኣሽቱ ካህናት ደቆምን ኩሎም ውሉደ ክህነት፡ ካህናትን ደናግልን ምእመናንን ቤተሰብን ኣብ ዝተሳተፍዎ',
  ),
  burialChurch: 'ደብረ መድሓኔ ዓለም',
  burialTown: 'ዓዲቀይሕ',

  openingVerse: { reference: 'ምሳሌ 10፥7', text: 'ሕያዎት ሰባት ብሕያውነቶም ይዝከሩ' },
  ordinationHymn: {
    geez: 'ለካህናቲከ እግዚኦ ለካህናቲከ እለ ኣሥመሩከ፡ ትቤሎሙ ባኡ ጽርሐ መቅደስከ ኅበ ይኅድር ኃይለ ስብሐቲከ',
    tigrinya: 'ኦ ጎይታ ነቶም ዘሐጎስኻ ኣገልገልቲ ካህናትካ፡ ናብቲ ሓይልኻን ክብርኻን ዝሓድረሉ ኣደራሽ መቕደስካ እትዉ ኢኻ ትብሎም',
  },
  acknowledgements: lexicalFromText(
    'ንኹሉኹም ኣብዚ ቀብሪ ኣቦና ዝተሳተፍኩም፡ ሕሰም ኣይትርከቡ የቐንየልና እናበልና ብስም ሰበኻ ሰገነይትን ቤተሰብን የቐንየልና ንብል።',
  ),
  condolencePrayer: lexicalFromText(
    'ንሰበኻ ከምኦም ዝበሉ ሕያዎትን ቅዱሳትን ካህናት ይልኣኸልና፡ ንቤተሰብ ከኣ ጽንዓት ይሃብ ንብል።',
  ),
  mourningClosed: true,
  mourningClosedText: 'ሰበኻ ከኣ ሓዘንና ኣብዚ ከምዝዓጸና ንሕብር።',

  slug: 'uqbagebriel-qeshi-weldemaryam-2026',
  publishedAt: '2026-08-15T12:00:00.000Z',
  updatedAt: '2026-08-15T12:00:00.000Z',
  createdAt: '2026-08-15T12:00:00.000Z',
  _status: 'published',
}
