import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface ApproveRequest {
  personaId: string
  approved: boolean
  issues?: string[]
  feedback?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ApproveRequest = await request.json()
    const { personaId, approved, issues = [], feedback = '' } = body

    if (!personaId) {
      return NextResponse.json({ error: 'personaId is required' }, { status: 400 })
    }

    // Update persona metadata with approval info
    const { data: persona, error } = await supabaseAdmin
      .from('personas')
      .update({
        metadata: {
          approval: {
            approved,
            issues,
            feedback,
            approved_at: new Date().toISOString()
          }
        }
      })
      .eq('id', personaId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 })
    }

    return NextResponse.json({ success: true, persona })
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 })
  }
}
