import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

type Locale = 'en' | 'ti'

const SUPPORTED: Locale[] = ['en', 'ti']

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = raw && SUPPORTED.includes(raw as Locale) ? (raw as Locale) : 'en'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
