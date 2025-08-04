export interface ProjectGraphic {
  id: string
  url: string
  platform: string
  size: string
  template: string
  prompt: string
  metadata?: {
    priority?: string
    estimatedEngagement?: number
    bestTimeToPost?: string
    style?: string
    hasPersona?: boolean
    personaName?: string
    suggestionId?: string
    [key: string]: any
  }
  createdAt?: string
}

export class ProjectGraphicsService {
  static async getProjectGraphics(projectId: string): Promise<ProjectGraphic[]> {
    try {
      const response = await fetch(`/api/projects/${projectId}/graphics`)
      if (!response.ok) {
        throw new Error('Failed to fetch graphics')
      }
      const data = await response.json()
      return data.graphics || []
    } catch (error) {
      console.error('Failed to fetch project graphics:', error)
      return []
    }
  }

  static async deleteGraphic(projectId: string, graphicId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/projects/${projectId}/graphics/${graphicId}`, {
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Failed to delete graphic:', error)
      return false
    }
  }

  static async bulkDownload(graphics: ProjectGraphic[]): Promise<void> {
    for (const graphic of graphics) {
      try {
        const response = await fetch(graphic.url)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${graphic.platform}-${graphic.template}-${graphic.id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Failed to download graphic ${graphic.id}:`, error)
      }
    }
  }

  static async copyToClipboard(graphic: ProjectGraphic): Promise<boolean> {
    try {
      // Try to copy the image itself
      const response = await fetch(graphic.url)
      const blob = await response.blob()
      
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        return true
      } else {
        // Fallback to copying URL
        await (navigator.clipboard as any).writeText(graphic.url)
        return true
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Final fallback - copy URL
      try {
        await navigator.clipboard.writeText(graphic.url)
        return true
      } catch {
        return false
      }
    }
  }

  static async shareGraphic(graphic: ProjectGraphic): Promise<void> {
    if (navigator.share) {
      try {
        const response = await fetch(graphic.url)
        const blob = await response.blob()
        const file = new File([blob], `${graphic.platform}-graphic.png`, { type: blob.type })
        
        await navigator.share({
          title: `${graphic.platform} Graphic`,
          text: graphic.prompt,
          files: [file]
        })
      } catch (error) {
        // Fallback to sharing URL
        try {
          await navigator.share({
            title: `${graphic.platform} Graphic`,
            text: graphic.prompt,
            url: graphic.url
          })
        } catch {
          // User cancelled or share not supported
        }
      }
    }
  }

  static filterByPlatform(graphics: ProjectGraphic[], platform: string): ProjectGraphic[] {
    if (platform === 'all') return graphics
    return graphics.filter(g => g.platform === platform)
  }

  static filterByPriority(graphics: ProjectGraphic[], priority: string): ProjectGraphic[] {
    if (priority === 'all') return graphics
    return graphics.filter(g => g.metadata?.priority === priority)
  }

  static sortByEngagement(graphics: ProjectGraphic[]): ProjectGraphic[] {
    return [...graphics].sort((a, b) => {
      const engagementA = a.metadata?.estimatedEngagement || 0
      const engagementB = b.metadata?.estimatedEngagement || 0
      return engagementB - engagementA
    })
  }

  static sortByDate(graphics: ProjectGraphic[], order: 'asc' | 'desc' = 'desc'): ProjectGraphic[] {
    return [...graphics].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return order === 'desc' ? dateB - dateA : dateA - dateB
    })
  }

  static getGraphicsByTemplate(graphics: ProjectGraphic[], template: string): ProjectGraphic[] {
    return graphics.filter(g => g.template === template)
  }

  static getHighPriorityGraphics(graphics: ProjectGraphic[]): ProjectGraphic[] {
    return graphics.filter(g => g.metadata?.priority === 'high')
  }

  static getGraphicsWithBestTimes(graphics: ProjectGraphic[]): ProjectGraphic[] {
    return graphics.filter(g => g.metadata?.bestTimeToPost)
  }

  static groupByPlatform(graphics: ProjectGraphic[]): Record<string, ProjectGraphic[]> {
    return graphics.reduce((groups, graphic) => {
      const platform = graphic.platform
      if (!groups[platform]) {
        groups[platform] = []
      }
      groups[platform].push(graphic)
      return groups
    }, {} as Record<string, ProjectGraphic[]>)
  }
} 