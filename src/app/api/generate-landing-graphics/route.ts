import { NextResponse } from "next/server"
import { FALService } from "@/lib/services/fal-ai-service"

// Generate hero and section images for the landing page
export async function POST(request: Request) {
  try {
    const { type } = await request.json()

    if (!FALService.isConfigured()) {
      return NextResponse.json(
        { error: "FAL API not configured" },
        { status: 500 }
      )
    }

    let prompt = ""
    let aspectRatio = "landscape_16_9"

    switch (type) {
      case "hero":
        prompt = `Modern SaaS dashboard floating in an abstract digital space, content creation workflow visualization, video clips transforming into social media posts and blog articles, purple and blue gradient color scheme, glowing neon accents, abstract geometric shapes, professional tech aesthetic, clean minimalist design, dark background with light elements, high-end product visualization, cinematic lighting`
        aspectRatio = "landscape_16_9"
        break
      case "features":
        prompt = `Abstract 3D illustration of AI content processing, neural network visualization with flowing data streams, purple and blue gradient, modern tech aesthetic, clean minimalist design, dark background, glowing elements`
        aspectRatio = "square"
        break
      case "persona":
        prompt = `AI digital avatar creation concept, human face transforming into digital representation, futuristic technology, purple and pink gradient, holographic effects, professional photography style`
        aspectRatio = "square"
        break
      default:
        prompt = `Abstract technology background, gradient from purple to blue, geometric shapes, modern SaaS aesthetic`
        aspectRatio = "landscape_16_9"
    }

    const result = await FALService.generateImage({
      prompt,
      model: "flux-pro-1.1",
      imageSize: aspectRatio as any,
      numImages: 1,
      outputFormat: "jpeg",
    })

    if (!result.images || result.images.length === 0) {
      return NextResponse.json(
        { error: "No images generated" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.images[0].url,
      type,
    })
  } catch (error) {
    console.error("Error generating landing graphics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
