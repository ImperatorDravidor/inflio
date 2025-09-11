import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      suggestionId,
      size = '1024x1024',
      quality = 'standard',
      count = 1,
      transparent = false
    } = await req.json()

    if (!suggestionId) {
      return NextResponse.json({ error: 'suggestionId is required' }, { status: 400 })
    }

    // Load suggestion
    const { data: suggestion, error: fetchError } = await supabaseAdmin
      .from('post_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const openai = getOpenAI()

    // Build a single prompt from the suggestion's hero/supporting prompts
    const basePrompt: string = suggestion.generation_prompt || suggestion.title || 'Social post graphic'

    const images: any[] = []
    for (let i = 0; i < count; i++) {
      const rsp = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: basePrompt,
        size,
        quality: quality as any,
        response_format: 'b64_json',
        background: transparent ? 'transparent' : undefined
      })

      const b64 = rsp.data?.[0]?.b64_json
      if (!b64) continue

      const buffer = Buffer.from(b64, 'base64')
      const fileName = `posts/${suggestion.project_id}/${suggestionId}-${Date.now()}-${i}.${transparent ? 'webp' : 'png'}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: `image/${transparent ? 'webp' : 'png'}`,
          upsert: false
        })

      if (uploadError) continue

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(fileName)

      images.push({ id: crypto.randomUUID(), url: publicUrl, position: i })
    }

    // Merge new images onto suggestion
    const mergedImages = [...(suggestion.images || []), ...images]
    await supabaseAdmin
      .from('post_suggestions')
      .update({ images: mergedImages, updated_at: new Date().toISOString() })
      .eq('id', suggestionId)

    return NextResponse.json({ success: true, images: images.map(i => i.url) })
  } catch (error) {
    console.error('Error generating assets:', error)
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 })
  }
}


