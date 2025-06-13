// API utility functions for the frontend

export async function uploadVideo(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload video')
  }

  return response.json()
}

export async function transcribeVideo(videoId: string, file: File) {
  const formData = new FormData()
  formData.append('videoId', videoId)
  formData.append('file', file)

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to transcribe video')
  }

  return response.json()
}

export async function getTranscript(videoId: string) {
  const response = await fetch(`/api/transcribe?videoId=${videoId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch transcript')
  }

  return response.json()
}

export async function processVideo(videoId: string, processingType: string) {
  const response = await fetch('/api/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId,
      processingType,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to process video')
  }

  return response.json()
} 