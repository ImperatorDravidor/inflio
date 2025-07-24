import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signed_request } = body

    // Parse Facebook signed request (simplified - in production, verify signature)
    const [, payload] = signed_request.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
    
    // Delete user's social data
    const supabase = createSupabaseServerClient()
    await supabase
      .from('social_integrations')
      .delete()
      .eq('profile->id', decodedPayload.user_id)
      .in('platform', ['facebook', 'instagram'])

    // Also delete any posts from this user
    await supabase
      .from('social_posts')
      .delete()
      .eq('metadata->facebook_user_id', decodedPayload.user_id)

    return NextResponse.json({ 
      url: `https://inflio.ai/data-deletion-complete`,
      confirmation_code: `DEL-${Date.now()}-${decodedPayload.user_id}`
    })
  } catch (error) {
    console.error('Data deletion error:', error)
    return NextResponse.json({ error: 'Data deletion failed' }, { status: 500 })
  }
}