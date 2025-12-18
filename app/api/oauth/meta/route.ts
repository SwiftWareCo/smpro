import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { env } from '@/lib/env.mjs'

export async function GET() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const appId = env.META_APP_ID
  const configId = env.META_CONFIG_ID
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`

  // State contains userId for security verification (CSRF protection)
  const state = Buffer.from(
    JSON.stringify({
      userId,
      timestamp: Date.now(),
    })
  ).toString('base64')

  // Facebook Login for Business - use config_id instead of scope
  // Permissions are configured in the Meta App Dashboard configuration
  const authUrl = new URL('https://www.facebook.com/v24.0/dialog/oauth')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('config_id', configId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  redirect(authUrl.toString())
}

