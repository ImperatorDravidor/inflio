import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signed_request } = body

    // Parse Facebook signed request (simplified - in production, verify signature)
    const [, payload] = signed_request.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
    
    // Remove user's social integration
    const supabase = await createClient()
    await supabase
      .from('social_integrations')
      .update({ disabled: true })
      .eq('profile->id', decodedPayload.user_id)
      .in('platform', ['facebook', 'instagram'])

    return NextResponse.json({ 
      url: `https://inflio.ai/social-disconnected`,
      confirmation_code: `${Date.now()}-${decodedPayload.user_id}`
    })
  } catch (error) {
    console.error('Deauth error:', error)
    return NextResponse.json({ error: 'Deauthorization failed' }, { status: 500 })
  }
}