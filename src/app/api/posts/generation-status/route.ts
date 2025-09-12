import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET endpoint to check generation status
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Check project generation status
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('post_generation_status')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (error || !project) {
      return NextResponse.json({ status: 'idle' })
    }

    return NextResponse.json({ 
      status: project.post_generation_status || 'idle' 
    })
  } catch (error) {
    console.error('Error checking generation status:', error)
    return NextResponse.json({ status: 'idle' })
  }
}

// POST endpoint to update generation status
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, status } = await req.json()

    if (!projectId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update project generation status
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ 
        post_generation_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating generation status:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating generation status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}