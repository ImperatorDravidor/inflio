import { fal } from "@fal-ai/client";

interface ThumbnailGenerationOptions {
  prompt: string;
  style?: 'realistic' | 'illustration' | 'anime' | 'watercolor';
  aspectRatio?: 'square' | 'portrait_16_9' | 'landscape_16_9';
  quality?: 'fast' | 'balanced' | 'high';
}

interface FluxThumbnailResult {
  url: string;
  seed: number;
  width: number;
  height: number;
}

export class FluxThumbnailService {
  private modelMap = {
    fast: "fal-ai/flux/schnell",
    balanced: "fal-ai/flux/dev", 
    high: "fal-ai/flux-pro"
  };

  private loraMap = {
    realistic: "fal-ai/flux-realism",
    illustration: "fal-ai/flux-half-illustration",
    anime: "fal-ai/flux-softserve-anime",
    watercolor: "fal-ai/flux-watercolor"
  };

  constructor(private apiKey: string) {
    fal.config({
      credentials: apiKey
    });
  }

  async generateThumbnail(options: ThumbnailGenerationOptions): Promise<FluxThumbnailResult> {
    const {
      prompt,
      style = 'realistic',
      aspectRatio = 'landscape_16_9',
      quality = 'balanced'
    } = options;

    // Build the enhanced prompt based on style
    const enhancedPrompt = this.enhancePromptForThumbnail(prompt, style);
    
    // Select the appropriate model
    const model = this.modelMap[quality];
    
    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt: enhancedPrompt,
          image_size: this.getImageSize(aspectRatio),
          num_inference_steps: quality === 'fast' ? 4 : 20,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
          seed: Math.floor(Math.random() * 1000000)
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Generating thumbnail...", update.logs);
          }
        }
      });

      const image = result.data.images[0];
      
      return {
        url: image.url,
        seed: result.data.seed,
        width: image.width,
        height: image.height
      };
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      throw new Error("Failed to generate thumbnail");
    }
  }

  async generateBatchThumbnails(
    prompts: string[], 
    options: Omit<ThumbnailGenerationOptions, 'prompt'>
  ): Promise<FluxThumbnailResult[]> {
    // Process in parallel but with rate limiting
    const batchSize = 3;
    const results: FluxThumbnailResult[] = [];
    
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(prompt => this.generateThumbnail({ ...options, prompt }))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  private enhancePromptForThumbnail(
    basePrompt: string, 
    style: 'realistic' | 'illustration' | 'anime' | 'watercolor'
  ): string {
    const styleEnhancements = {
      realistic: "photorealistic, professional photography, high quality, sharp focus, vibrant colors",
      illustration: "digital illustration, artistic, creative design, bold colors",
      anime: "anime style, manga aesthetic, vibrant anime colors, clean lines",
      watercolor: "watercolor painting style, soft colors, artistic brush strokes"
    };

    const thumbnailOptimizations = "eye-catching thumbnail, clear focal point, high contrast, engaging composition";
    
    return `${basePrompt}, ${styleEnhancements[style]}, ${thumbnailOptimizations}`;
  }

  private getImageSize(
    aspectRatio: 'square' | 'portrait_16_9' | 'landscape_16_9'
  ): { width: number; height: number } {
    const sizes = {
      square: { width: 1024, height: 1024 },
      portrait_16_9: { width: 720, height: 1280 },
      landscape_16_9: { width: 1280, height: 720 }
    };
    
    return sizes[aspectRatio] || sizes.landscape_16_9;
  }

  // Method to generate YouTube-style thumbnails
  async generateYouTubeThumbnail(
    title: string,
    description: string,
    style: 'realistic' | 'illustration' = 'realistic'
  ): Promise<FluxThumbnailResult> {
    const prompt = `
      YouTube thumbnail for video titled "${title}".
      ${description}.
      Bold text overlay space, dramatic lighting, high engagement design,
      professional YouTube thumbnail style, clickable and attention-grabbing
    `;

    return this.generateThumbnail({
      prompt,
      style,
      aspectRatio: 'landscape_16_9',
      quality: 'high'
    });
  }

  // Method for product thumbnails
  async generateProductThumbnail(
    productName: string,
    productDescription: string,
    background: string = "clean white background"
  ): Promise<FluxThumbnailResult> {
    const prompt = `
      Product photography of ${productName}.
      ${productDescription}.
      ${background}, professional product shot, commercial quality,
      centered composition, perfect lighting
    `;

    return this.generateThumbnail({
      prompt,
      style: 'realistic',
      aspectRatio: 'square',
      quality: 'high'
    });
  }
}

// Usage example
export function createFluxThumbnailService(): FluxThumbnailService {
  const apiKey = process.env.FAL_KEY || '';
  if (!apiKey) {
    throw new Error('FAL_KEY environment variable is required');
  }
  
  return new FluxThumbnailService(apiKey);
} 