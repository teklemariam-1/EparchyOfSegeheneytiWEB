import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import config from '@payload-config'
import { NextRequest } from 'next/server'

export const maxDuration = 60

type RouteHandler = (req: NextRequest, ctx: unknown) => Promise<Response>

function withErrorBody(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx: unknown) => {
    try {
      return await handler(req, ctx)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      console.error('[payload-route] uncaught error:', message, stack)
      return Response.json({ error: message, stack }, { status: 500 })
    }
  }
}

export const GET = withErrorBody(REST_GET(config) as RouteHandler)
export const POST = withErrorBody(REST_POST(config) as RouteHandler)
export const DELETE = withErrorBody(REST_DELETE(config) as RouteHandler)
export const PATCH = withErrorBody(REST_PATCH(config) as RouteHandler)
export const PUT = withErrorBody(REST_PUT(config) as RouteHandler)
