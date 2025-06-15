import { SupabaseClient } from '@supabase/supabase-js'

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadVideoInChunks(
  supabase: SupabaseClient,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    console.log(`[Chunked] Starting chunked upload for: ${filePath}`)
    
    // 1. Create an empty file first
    const { error: createError } = await supabase.storage
      .from('videos')
      .upload(filePath, new ArrayBuffer(0), {
        upsert: false, // Don't replace if it exists from a previous attempt
        contentType: file.type
      })

    // If it's not a 'Duplicate' error, something is wrong
    if (createError && createError.message !== 'The resource already exists') {
        throw createError
    }
    
    // 2. Upload chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    console.log(`[Chunked] Splitting file into ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB`)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      console.log(`[Chunked] Uploading chunk ${i + 1}/${totalChunks} (bytes ${start}-${end})`)

      const { error: chunkError } = await supabase.storage
        .from('videos')
        .upload(filePath, chunk, {
          cacheControl: '3600',
          upsert: true, // Use upsert to append the chunk
          contentType: file.type
        })
      
      if (chunkError) {
        console.error(`[Chunked] Error uploading chunk ${i + 1}:`, chunkError)
        throw chunkError
      }
      
      // Update progress
      if (onProgress) {
        const progress = Math.round(((i + 1) / totalChunks) * 100)
        onProgress(progress)
      }
    }

    console.log('[Chunked] All chunks uploaded successfully.')
    return true

  } catch (error) {
    console.error('[Chunked] Chunked upload failed:', error)
    // Attempt to clean up the partial file
    await supabase.storage.from('videos').remove([filePath])
    throw error
  }
} 
