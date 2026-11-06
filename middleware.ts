import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const sensitiveAuthParams = new Set(['code', 'token', 'token_hash', 'access_token', 'refresh_token', 'id_token'])
  const containsSensitiveAuthParam = Array.from(request.nextUrl.searchParams.keys())
    .some((param) => sensitiveAuthParams.has(param.toLowerCase()))
  if (
    request.nextUrl.pathname === '/auth'
    && containsSensitiveAuthParam
  ) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    const response = NextResponse.redirect(callbackUrl, 303)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
