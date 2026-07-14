import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Keep the public payload minimal — no version/environment disclosure.
  return NextResponse.json(
    {
      status: 'ok',
      service: 'eparchy-segeneyti-web',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
