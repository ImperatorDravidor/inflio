import { inngest } from './client'
import { VizardAPIService } from '@/lib/vizard-api'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateTaskProgressServer, updateProjectServer } from '@/lib/server-project-utils'

/**
 * Process video clips with Vizard AI
 * Flow: Send video URL to Vizard → Generate clips → Poll for completion
 */
export const processVizardVideo = inngest.createFunction(
  {
    id: 'process-vizard-video',
    name: 'Process Vizard Video',
    throttle: {
      limit: 3,  // Vizard rate limit: 3/min
      period: '1m',
      key: 'event.data.userId'
    }
  },
  { event: 'vizard/video.process' },
  async ({ event, step }) => {
    const { projectId, videoUrl, userId, title } = event.data

    console.log('[Inngest] Starting Vizard clip generation for:', projectId)

    // Check if Vizard project already exists (idempotency)
    // Use admin client since this runs server-side in Inngest (browser client won't work here)
    const { data: existingProject } = await supabaseAdmin
      .from('projects')
      .select('vizard_project_id')
      .eq('id', projectId)
      .single()
    
    if (existingProject?.vizard_project_id) {
      console.log('[Inngest] Vizard project already exists:', existingProject.vizard_project_id)
      console.log('[Inngest] Skipping duplicate creation')
      return {
        success: true,
        message: 'Vizard project already exists',
        vizardProjectId: existingProject.vizard_project_id,
        duplicate: true
      }
    }

    // Progress already set to 5% by process route - update to 10% when starting
    await updateTaskProgressServer(projectId, 'clips', 10, 'processing')

    // Create Vizard project with direct video URL
    const vizardProject = await step.run('create-vizard-project', async () => {
      console.log('[Inngest] Creating Vizard project for:', projectId)
      console.log('[Inngest] Using direct video URL:', videoUrl)

      const webhookUrl = process.env.VIZARD_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vizard`

      const project = await VizardAPIService.createProject({
        lang: 'auto',                          // Auto-detect language
        preferLength: VizardAPIService.ClipLength.AUTO,  // AI decides clip length
        videoUrl: videoUrl,                    // Direct Supabase URL
        videoType: VizardAPIService.VideoType.REMOTE_FILE,
        ext: 'mp4',                            // Required for videoType 1
        ratioOfClip: VizardAPIService.AspectRatio.VERTICAL,  // 9:16 for TikTok/Reels
        subtitleSwitch: 1,                     // Show subtitles
        headlineSwitch: 1,                     // Show AI headline
        maxClipNumber: 20,                     // Max 20 clips
        projectName: title || `Project ${projectId}`,
        webhookUrl,
      })

      // Store Vizard project ID
      await updateProjectServer(projectId, {
        vizard_project_id: project.projectId
      })

      await updateTaskProgressServer(projectId, 'clips', 15, 'processing')

      console.log('[Inngest] Vizard project created:', project.projectId)
      console.log('[Inngest] Share link:', project.shareLink)
      console.log('[Inngest] Processing will continue in background.')

      return project
    })

    // Note: Clips processing happens in background
    // Poll or use webhook to get clips when ready

    console.log('[Inngest] Vizard job submitted successfully')
    console.log('[Inngest] Project ID:', vizardProject.projectId)

    return {
      success: true,
      message: 'Vizard clip generation started. Polling will retrieve clips when ready.',
      vizardProjectId: vizardProject.projectId
    }
  }
)


/**
 * Check Vizard processing status (for manual polling)
 */
export const checkVizardStatus = inngest.createFunction(
  {
    id: 'check-vizard-status',
    name: 'Check Vizard Status',
  },
  { event: 'vizard/status.check' },
  async ({ event, step }) => {
    const { projectId } = event.data

    // Use admin client since this runs server-side in Inngest
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('vizard_project_id')
      .eq('id', projectId)
      .single()
    
    if (!project?.vizard_project_id) {
      return { status: 'not_started' }
    }

    try {
      const status = await VizardAPIService.getProjectStatus(project.vizard_project_id)
      // Vizard returns videos array, not a status field
      const hasVideos = status.videos && status.videos.length > 0
      return {
        status: hasVideos ? 'completed' : 'processing',
        ready: hasVideos,
        clips: status.videos || [],
        projectId: status.projectId
      }
    } catch (error: any) {
      return { status: 'error', error: error?.message || 'Unknown error' }
    }
  }
)

// Backward compatibility: Old function names point to Vizard
export const processSubmagicVideo = processVizardVideo
export const processKlapVideo = processVizardVideo
export const checkSubmagicStatus = checkVizardStatus
export const checkKlapStatus = checkVizardStatus

/**
 * Generate persona portraits via Inngest
 * 
 * Each portrait runs as its own step.run(), so each gets its own
 * serverless invocation. Total job can span 10+ minutes without
 * hitting any single-function timeout.
 */
export const generatePersonaPortraits = inngest.createFunction(
  {
    id: 'generate-persona-portraits',
    name: 'Generate Persona Portraits',
    concurrency: {
      limit: 2,        // Max 2 concurrent persona generations per user
      key: 'event.data.userId'
    },
    retries: 1
  },
  { event: 'persona/generate.portraits' },
  async ({ event, step }) => {
    const { personaId, userId, personName, photoUrls } = event.data

    console.log(`[Inngest:Persona] Starting portrait generation for persona ${personaId}`)

    // Step 1: Analyze photos and select best ones
    const analysis = await step.run('analyze-photos', async () => {
      const { createNanoBananaService } = await import('@/lib/services/nano-banana-service')
      const service = createNanoBananaService()
      const result = await service.analyzePhotos(photoUrls)
      console.log(`[Inngest:Persona] Selected ${result.bestPhotos.length} best photos`)
      return result
    })

    // Step 2: Get scenario list (deterministic, no API call)
    const scenarios = await step.run('get-scenarios', async () => {
      const { createNanoBananaService } = await import('@/lib/services/nano-banana-service')
      const service = createNanoBananaService()
      const allScenarios = service.getPortraitScenarios(personName)
      // Return serializable data (strip the prompt to keep step output small)
      return allScenarios.map((s, i) => ({
        index: i,
        type: s.type,
        category: s.category,
        title: s.title,
        prompt: s.prompt
      }))
    })

    // Steps 3-12: Generate each portrait individually
    // Each step.run() is its own serverless invocation — no timeout issues
    let successCount = 0

    for (const scenario of scenarios) {
      try {
        await step.run(`generate-portrait-${scenario.index}-${scenario.type}`, async () => {
          const { createNanoBananaService } = await import('@/lib/services/nano-banana-service')
          const service = createNanoBananaService()

          console.log(`[Inngest:Persona] [${scenario.index + 1}/${scenarios.length}] Generating: ${scenario.title}`)

          const result = await service.generateImage({
            prompt: scenario.prompt,
            referenceImages: analysis.bestPhotos,
            resolution: '2K',
            aspectRatio: '4:5'
          })

          // Save portrait immediately to DB
          await supabaseAdmin
            .from('persona_images')
            .insert({
              persona_id: personaId,
              user_id: userId,
              image_url: result.url,
              metadata: {
                type: 'reference_portrait',
                portraitType: scenario.type,
                category: scenario.category,
                title: scenario.title,
                generatedBy: 'gemini-3-pro-image-preview'
              }
            })

          console.log(`[Inngest:Persona] [${scenario.index + 1}/${scenarios.length}] ✓ Saved: ${scenario.title}`)
          return { url: result.url, type: scenario.type, category: scenario.category, title: scenario.title }
        })

        successCount++
      } catch (error) {
        console.error(`[Inngest:Persona] Failed portrait ${scenario.title}:`, error)
        // Continue with remaining portraits
      }
    }

    // Final step: Update persona status
    await step.run('finalize-persona', async () => {
      if (successCount === 0) {
        // All failed
        await supabaseAdmin
          .from('personas')
          .update({
            status: 'failed',
            metadata: {
              error: 'All portrait generations failed',
              processingFailed: new Date().toISOString()
            }
          })
          .eq('id', personaId)
        
        console.log(`[Inngest:Persona] Persona ${personaId} FAILED — 0 portraits generated`)
        return { status: 'failed' }
      }

      // Fetch all generated portraits for metadata
      const { data: images } = await supabaseAdmin
        .from('persona_images')
        .select('image_url, metadata')
        .eq('persona_id', personaId)
        .eq('metadata->>type', 'reference_portrait')

      const portraits = images || []
      const generalPortraits = portraits.filter(p => (p.metadata as any)?.category === 'general')
      const useCasePortraits = portraits.filter(p => (p.metadata as any)?.category === 'use_case')

      await supabaseAdmin
        .from('personas')
        .update({
          status: 'ready',
          metadata: {
            photoCount: photoUrls.length,
            photoUrls: photoUrls,
            referencePhotoUrls: analysis.bestPhotos,
            portraitUrls: portraits.map(p => p.image_url),
            generalPortraitUrls: generalPortraits.map(p => p.image_url),
            useCasePortraitUrls: useCasePortraits.map(p => p.image_url),
            analysisQuality: analysis.quality,
            consistencyScore: analysis.consistencyScore,
            totalGenerated: successCount,
            totalAttempted: scenarios.length,
            processingCompleted: new Date().toISOString()
          }
        })
        .eq('id', personaId)

      console.log(`[Inngest:Persona] Persona ${personaId} READY — ${successCount}/${scenarios.length} portraits`)
      return { status: 'ready', successCount }
    })

    return { success: true, personaId, portraitsGenerated: successCount }
  }
)

/**
 * Train LoRA model for persona via Inngest
 * Training takes 10-30 minutes — far beyond any serverless timeout
 */
export const trainPersonaLoRA = inngest.createFunction(
  {
    id: 'train-persona-lora',
    name: 'Train Persona LoRA Model',
    concurrency: { limit: 1, key: 'event.data.userId' },
    retries: 1
  },
  { event: 'persona/train.lora' },
  async ({ event, step }) => {
    const { jobId, personaId, userId, imagesDataUrl, triggerPhrase, learningRate, steps: trainingSteps, multiresolutionTraining, subjectCrop, createMasks } = event.data

    console.log(`[Inngest:LoRA] Starting training for job ${jobId}`)

    // Step 1: Train the LoRA model (the long operation)
    const result = await step.run('train-lora-model', async () => {
      const { FALService } = await import('@/lib/services/fal-ai-service')
      if (!FALService.isConfigured()) {
        throw new Error('FAL API key not configured')
      }
      return await FALService.trainLoRA({
        imagesDataUrl,
        triggerPhrase,
        learningRate,
        steps: trainingSteps,
        multiresolutionTraining,
        subjectCrop,
        createMasks
      })
    })

    // Step 2: Save results to database
    await step.run('save-lora-results', async () => {
      // Update job record
      await supabaseAdmin
        .from('lora_training_jobs')
        .update({
          status: 'completed',
          lora_model_url: result.diffusersLoraFile.url,
          lora_config_url: result.configFile.url,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Update persona
      await supabaseAdmin
        .from('personas')
        .update({
          status: 'trained',
          lora_model_url: result.diffusersLoraFile.url,
          lora_config_url: result.configFile.url,
          lora_trigger_phrase: triggerPhrase,
          lora_training_status: 'completed',
          lora_trained_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          training_job_id: jobId
        })
        .eq('id', personaId)

      // Set default persona if none exists
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('default_persona_id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profile?.default_persona_id) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ default_persona_id: personaId })
          .eq('clerk_user_id', userId)
      }

      console.log(`[Inngest:LoRA] Training completed for job ${jobId}`)
    })

    return { success: true, jobId, loraUrl: result.diffusersLoraFile.url }
  }
)

/**
 * Batch thumbnail generation via Inngest
 * Each thumbnail is its own step — no timeout issues
 */
export const batchGenerateThumbnails = inngest.createFunction(
  {
    id: 'batch-generate-thumbnails',
    name: 'Batch Generate Thumbnails',
    concurrency: { limit: 2, key: 'event.data.userId' },
    retries: 1
  },
  { event: 'thumbnail/batch.generate' },
  async ({ event, step }) => {
    const { batchId, projectId, userId, jobs } = event.data

    console.log(`[Inngest:Thumbnails] Starting batch ${batchId} with ${jobs.length} jobs`)

    // Mark batch as processing
    await step.run('mark-processing', async () => {
      await supabaseAdmin
        .from('thumbnail_batch_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', batchId)
    })

    const generationIds: string[] = []
    let completedCount = 0
    let failedCount = 0

    // Process each thumbnail as its own step
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      try {
        const result = await step.run(`generate-thumbnail-${i}`, async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/thumbnail/generate-enhanced`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
            },
            body: JSON.stringify({
              projectId,
              prompt: job.prompt,
              settings: job.settings
            })
          })

          if (!response.ok) {
            throw new Error(`Thumbnail generation failed: ${response.status}`)
          }
          return await response.json()
        })

        generationIds.push(result.id)
        completedCount++
      } catch (error) {
        console.error(`[Inngest:Thumbnails] Job ${i} failed:`, error)
        failedCount++
      }

      // Update progress after each thumbnail
      await step.run(`update-progress-${i}`, async () => {
        await supabaseAdmin
          .from('thumbnail_batch_jobs')
          .update({
            completed_count: completedCount,
            failed_count: failedCount,
            generation_ids: generationIds
          })
          .eq('id', batchId)
      })
    }

    // Finalize batch
    await step.run('finalize-batch', async () => {
      await supabaseAdmin
        .from('thumbnail_batch_jobs')
        .update({
          status: failedCount === jobs.length ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          generation_ids: generationIds
        })
        .eq('id', batchId)

      if (completedCount > 0) {
        await supabaseAdmin
          .rpc('increment_usage', {
            user_id: userId,
            field: 'thumbnails_generated',
            amount: completedCount
          })
      }

      console.log(`[Inngest:Thumbnails] Batch ${batchId} complete: ${completedCount}/${jobs.length}`)
    })

    return { success: true, batchId, completedCount, failedCount }
  }
)

/**
 * Process Klap video clips via Inngest
 * Uses step.run for polling + clip processing — survives well beyond 300s
 */
export const processKlapVideoClips = inngest.createFunction(
  {
    id: 'process-klap-video-clips',
    name: 'Process Klap Video Clips',
    concurrency: { limit: 2, key: 'event.data.projectId' },
    retries: 1
  },
  { event: 'klap/video.process' },
  async ({ event, step }) => {
    const { jobId, projectId, videoUrl } = event.data

    console.log(`[Inngest:Klap] Starting job ${jobId} for project ${projectId}`)

    // Step 1: Create Klap task
    const task = await step.run('create-klap-task', async () => {
      const { KlapAPIService } = await import('@/lib/klap-api')
      const { KlapJobQueue } = await import('@/lib/redis')

      await KlapJobQueue.updateJob(jobId, { progress: 15 })
      const result = await KlapAPIService.createVideoTask(videoUrl)

      await KlapJobQueue.updateJob(jobId, { taskId: result.id, progress: 25 })
      await supabaseAdmin
        .from('projects')
        .update({ klap_project_id: result.id, updated_at: new Date().toISOString() })
        .eq('id', projectId)

      console.log(`[Inngest:Klap] Task created: ${result.id}`)
      return { taskId: result.id }
    })

    // Step 2: Poll for completion (each poll attempt is its own step for durability)
    const pollResult = await step.run('poll-klap-completion', async () => {
      const maxAttempts = 180
      let attempts = 0

      while (attempts < maxAttempts) {
        const response = await fetch(`https://api.klap.app/v2/tasks/${task.taskId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 60000))
            attempts += 12
            continue
          }
          throw new Error(`Klap API error: ${response.status}`)
        }

        const status = await response.json()

        if (status.status === 'failed' || status.status === 'error') {
          throw new Error(`Klap processing failed: ${status.error || 'Unknown error'}`)
        }

        if (status.status === 'ready' && status.output_id) {
          console.log(`[Inngest:Klap] Task complete! Output: ${status.output_id}`)
          return { outputId: status.output_id }
        }

        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
      }

      throw new Error('Klap processing timed out after 15 minutes')
    })

    // Step 3: Get clips from Klap
    const klapClips = await step.run('fetch-klap-clips', async () => {
      const { KlapAPIService } = await import('@/lib/klap-api')
      const { KlapJobQueue } = await import('@/lib/redis')

      await KlapJobQueue.updateJob(jobId, { folderId: pollResult.outputId, progress: 50 })

      await supabaseAdmin
        .from('projects')
        .update({
          klap_folder_id: pollResult.outputId,
          klap_project_id: pollResult.outputId,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      const clips = await KlapAPIService.getClipsFromFolder(pollResult.outputId)
      if (!clips || clips.length === 0) throw new Error('No clips generated')
      return clips.map((c: any) => typeof c === 'string' ? c : c.id).filter(Boolean)
    })

    // Step 4: Process each clip
    const processedClips: any[] = []
    for (let i = 0; i < klapClips.length; i++) {
      try {
        const clip = await step.run(`process-clip-${i}`, async () => {
          const { KlapAPIService } = await import('@/lib/klap-api')
          const { KlapJobQueue } = await import('@/lib/redis')
          const klapId = klapClips[i]

          const progress = 50 + Math.floor((i / klapClips.length) * 40)
          await KlapJobQueue.updateJob(jobId, { progress })

          let details: any = {}
          try { details = await KlapAPIService.getClipDetails(pollResult.outputId, klapId) } catch {}

          const exported = await KlapAPIService.exportMultipleClips(pollResult.outputId, [klapId])
          if (!exported[0]?.url) throw new Error(`Failed to export clip ${klapId}`)

          // Download and store
          const videoResponse = await fetch(exported[0].url)
          if (!videoResponse.ok) throw new Error(`Failed to download clip: ${videoResponse.status}`)
          const buffer = await videoResponse.arrayBuffer()
          const fileName = `${projectId}/clips/clip_${i}_${Date.now()}.mp4`

          await supabaseAdmin.storage.from('videos').upload(fileName, buffer, { contentType: 'video/mp4', upsert: true })
          const { data: { publicUrl } } = supabaseAdmin.storage.from('videos').getPublicUrl(fileName)

          return {
            id: `${projectId}_clip_${i}`,
            title: details.title || details.name || `Clip ${i + 1}`,
            description: details.virality_score_explanation || details.description || '',
            startTime: details.start_time || 0,
            endTime: details.end_time || 0,
            duration: details.duration || 30,
            thumbnail: details.thumbnail || `https://klap.app/player/${klapId}/thumbnail`,
            tags: details.tags || [],
            score: typeof details.virality_score === 'number' ? details.virality_score / 100 : 0.5,
            type: 'highlight' as const,
            klapProjectId: klapId,
            klapFolderId: pollResult.outputId,
            exportUrl: publicUrl,
            exported: true,
            storedInSupabase: true,
            createdAt: new Date().toISOString(),
            viralityExplanation: details.virality_score_explanation || details.description || '',
            transcript: details.transcript || details.subtitle || details.text || '',
            rawKlapData: details,
            publicationCaptions: details.publication_captions || details.captions || undefined
          }
        })
        processedClips.push(clip)
      } catch (error) {
        console.error(`[Inngest:Klap] Failed to process clip ${i}:`, error)
      }
    }

    // Step 5: Save all clips to project
    await step.run('save-clips', async () => {
      const { KlapJobQueue } = await import('@/lib/redis')
      const { updateTaskProgressServer } = await import('@/lib/server-project-utils')

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('folders')
        .eq('id', projectId)
        .single()

      const existingFolders = (project?.folders || {}) as any
      await supabaseAdmin
        .from('projects')
        .update({
          folders: {
            clips: processedClips,
            images: existingFolders.images || [],
            social: existingFolders.social || [],
            blog: existingFolders.blog || [],
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      await updateTaskProgressServer(projectId, 'clips', 100, 'completed')
      await KlapJobQueue.completeJob(jobId, processedClips)

      console.log(`[Inngest:Klap] Saved ${processedClips.length} clips for project ${projectId}`)
    })

    return { success: true, jobId, clipsProcessed: processedClips.length }
  }
)

/**
 * Generate social media posts via Inngest
 * Replaces the posts/worker endpoint
 */
export const generatePostsWorker = inngest.createFunction(
  {
    id: 'generate-posts-worker',
    name: 'Generate Social Posts',
    concurrency: { limit: 3, key: 'event.data.userId' },
    retries: 2
  },
  { event: 'posts/generate.worker' },
  async ({ event, step }) => {
    const { jobId } = event.data

    console.log(`[Inngest:Posts] Processing job ${jobId}`)

    // Step 1: Fetch job and project data
    const context = await step.run('fetch-context', async () => {
      const { fetchBrandAndPersonaContext, extractTranscriptText } = await import('@/lib/ai-context')

      const { data: job } = await supabaseAdmin
        .from('post_generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (!job) throw new Error('Job not found')
      if (job.status === 'completed') return { skip: true }

      await supabaseAdmin
        .from('post_generation_jobs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', jobId)

      const params = job.input_params
      let fullTranscript = params.transcript || ''
      let contentBrief: any = null

      if (!fullTranscript) {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('transcription, content_brief')
          .eq('id', params.projectId)
          .single()
        fullTranscript = extractTranscriptText(project?.transcription)
        contentBrief = project?.content_brief
      } else {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('content_brief')
          .eq('id', params.projectId)
          .single()
        contentBrief = project?.content_brief
      }

      const personaId = params.settings?.selectedPersonaId || params.settings?.personaId
      const { brand, persona } = params.userId
        ? await fetchBrandAndPersonaContext(params.userId, params.settings?.usePersona ? personaId : null)
        : { brand: undefined, persona: null }

      return { skip: false, params, fullTranscript, contentBrief, brand, persona }
    })

    if (context.skip) return { status: 'already_completed' }

    // Step 2: Call GPT-5.2
    const posts = await step.run('generate-with-gpt', async () => {
      const { AdvancedPostsService } = await import('@/lib/ai-posts-advanced')
      const { params, fullTranscript, contentBrief, brand, persona } = context as any

      const input = {
        transcript: fullTranscript,
        projectTitle: params.projectTitle,
        contentAnalysis: {
          topics: params.contentAnalysis?.topics || [],
          keywords: params.contentAnalysis?.keywords || [],
          keyPoints: params.contentAnalysis?.keyPoints || [],
          sentiment: params.contentAnalysis?.sentiment,
          summary: params.contentAnalysis?.summary,
          keyMoments: params.contentAnalysis?.keyMoments || [],
          socialMediaHooks: params.contentAnalysis?.contentSuggestions?.socialMediaHooks || [],
        },
        platforms: params.settings?.platforms || brand?.primaryPlatforms || ['instagram', 'twitter', 'linkedin'],
        brand,
        persona,
        tone: params.settings?.tone,
        contentGoal: params.settings?.contentGoal,
        contentTypes: params.settings?.contentTypes,
        contentBrief,
        creativity: params.settings?.creativity,
      }

      console.log(`[Inngest:Posts] Calling GPT-5.2 for job ${jobId}`)
      return await AdvancedPostsService.generateAdvancedPosts(input)
    })

    // Step 3: Save suggestions
    await step.run('save-suggestions', async () => {
      const { v4: uuidv4 } = await import('uuid')
      const { params, brand, persona } = context as any

      const suggestions = posts.map((post: any) => {
        const suggestionId = uuidv4()
        const copyVariants: Record<string, any> = {}
        if (post.platformCopy) {
          for (const [platform, copy] of Object.entries(post.platformCopy) as any) {
            copyVariants[platform] = {
              caption: copy.caption, hashtags: copy.hashtags || [], cta: copy.cta || '',
              title: post.title, description: post.hook,
            }
          }
        }
        const images: any[] = []
        if (post.imagePrompt) {
          images.push({ id: uuidv4(), type: 'hero', prompt: post.imagePrompt, text_overlay: '', dimensions: post.imageDimensions || '1080x1350', position: 0 })
        }
        if (post.contentType === 'carousel' && post.carouselSlides?.length) {
          for (const slide of post.carouselSlides) {
            if (slide.visualPrompt) {
              images.push({ id: uuidv4(), type: `slide_${slide.slideNumber}`, prompt: slide.visualPrompt, text_overlay: slide.headline || '', dimensions: '1080x1350', position: slide.slideNumber })
            }
          }
        }
        return {
          id: suggestionId, project_id: params.projectId, user_id: params.userId,
          type: post.contentType, content_type: post.contentType, title: post.title,
          description: post.hook, platforms: Object.keys(copyVariants), copy_variants: copyVariants,
          images, visual_style: { style: post.imageStyle || 'modern', colors: brand?.colors?.primary || [], description: post.imagePrompt },
          engagement_data: { predicted_reach: post.engagement?.estimatedReach || 'medium', target_audience: post.engagement?.targetAudience || '', best_time: post.engagement?.bestTimeToPost || '', why_it_works: post.engagement?.whyItWorks || '' },
          persona_id: persona?.id || null, persona_used: !!persona, generation_model: 'gpt-5.2',
          metadata: { hook: post.hook, transcript_quote: post.transcriptQuote, carousel_slides: post.carouselSlides || null, content_goal: params.settings?.contentGoal || null, tone: params.settings?.tone || null, job_id: jobId },
          status: 'ready', created_at: new Date().toISOString(),
        }
      })

      if (suggestions.length > 0) {
        const { error } = await supabaseAdmin.from('post_suggestions').insert(suggestions)
        if (error) throw new Error(`Failed to save suggestions: ${error.message}`)
      }

      await supabaseAdmin
        .from('post_generation_jobs')
        .update({
          status: 'completed', completed_items: suggestions.length, total_items: suggestions.length,
          output_data: { suggestion_ids: suggestions.map((s: any) => s.id) },
          completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      console.log(`[Inngest:Posts] Job ${jobId} completed with ${suggestions.length} suggestions`)
      return { count: suggestions.length }
    })

    return { success: true, jobId, count: posts.length }
  }
)