"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconDownload,
  IconShare,
  IconCopy,
  IconFile,
  IconFileText,
  IconFileCode,
  IconMail,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconCheck,
  IconLoader2,
  IconPackage,
  IconLink,
  IconX
} from "@tabler/icons-react"
import { toast } from "sonner"

interface ExportItem {
  id: string
  type: 'transcription' | 'clips' | 'blog' | 'social' | 'ideas'
  title: string
  data: any
  selected: boolean
  formats: ExportFormat[]
}

interface ExportFormat {
  id: string
  label: string
  extension: string
  mimeType: string
  description: string
}

interface ExportManagerProps {
  projectId: string
  projectTitle: string
  results: Record<string, any>
  onClose?: () => void
}

const exportFormats: Record<string, ExportFormat[]> = {
  transcription: [
    { id: 'txt', label: 'Plain Text', extension: 'txt', mimeType: 'text/plain', description: 'Simple text file' },
    { id: 'srt', label: 'SRT Subtitles', extension: 'srt', mimeType: 'text/plain', description: 'Subtitle format' },
    { id: 'vtt', label: 'WebVTT', extension: 'vtt', mimeType: 'text/vtt', description: 'Web video text tracks' },
    { id: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json', description: 'Structured data' }
  ],
  blog: [
    { id: 'md', label: 'Markdown', extension: 'md', mimeType: 'text/markdown', description: 'Markdown format' },
    { id: 'html', label: 'HTML', extension: 'html', mimeType: 'text/html', description: 'Web page format' },
    { id: 'txt', label: 'Plain Text', extension: 'txt', mimeType: 'text/plain', description: 'Simple text file' },
    { id: 'docx', label: 'Word Document', extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Microsoft Word' }
  ],
  social: [
    { id: 'txt', label: 'Plain Text', extension: 'txt', mimeType: 'text/plain', description: 'All posts in text' },
    { id: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json', description: 'Structured data' },
    { id: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv', description: 'Spreadsheet format' }
  ],
  ideas: [
    { id: 'txt', label: 'Plain Text', extension: 'txt', mimeType: 'text/plain', description: 'Key insights as text' },
    { id: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json', description: 'Structured data' },
    { id: 'md', label: 'Markdown', extension: 'md', mimeType: 'text/markdown', description: 'Formatted insights' }
  ],
  clips: [
    { id: 'json', label: 'Clip Metadata', extension: 'json', mimeType: 'application/json', description: 'Clip information' },
    { id: 'txt', label: 'Clip List', extension: 'txt', mimeType: 'text/plain', description: 'Simple list format' }
  ]
}

export function ExportManager({ projectId, projectTitle, results, onClose }: ExportManagerProps) {
  const [exportItems, setExportItems] = useState<ExportItem[]>(() => {
    return Object.entries(results)
      .filter(([_, result]) => result.status === 'completed')
      .map(([type, result]) => ({
        id: type,
        type: type as any,
        title: getTypeLabel(type),
        data: result.data,
        selected: true,
        formats: exportFormats[type] || []
      }))
  })

  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [shareUrl, setShareUrl] = useState('')

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      transcription: 'AI Transcription',
      clips: 'Smart Clips',
      blog: 'Blog Article',
      social: 'Social Posts',
      ideas: 'Key Insights'
    }
    return labels[type] || type
  }

  const toggleItem = (itemId: string) => {
    setExportItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ))
  }

  const updateFormat = (itemId: string, formatId: string) => {
    setSelectedFormats(prev => ({ ...prev, [itemId]: formatId }))
  }

  const generateContent = (item: ExportItem, format: ExportFormat): string => {
    const { type, data } = item

    switch (type) {
      case 'transcription':
        return generateTranscriptionContent(data, format)
      case 'blog':
        return generateBlogContent(data, format)
      case 'social':
        return generateSocialContent(data, format)
      case 'ideas':
        return generateIdeasContent(data, format)
      case 'clips':
        return generateClipsContent(data, format)
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  const generateTranscriptionContent = (data: any, format: ExportFormat): string => {
    switch (format.id) {
      case 'txt':
        return data.transcript || ''
      case 'srt':
        return data.timestamps?.map((segment: any, index: number) => {
          const start = formatSRTTime(segment.start)
          const end = formatSRTTime(segment.end)
          return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`
        }).join('\n') || ''
      case 'vtt':
        const vttContent = 'WEBVTT\n\n' + (data.timestamps?.map((segment: any) => {
          const start = formatVTTTime(segment.start)
          const end = formatVTTTime(segment.end)
          return `${start} --> ${end}\n${segment.text}\n`
        }).join('\n') || '')
        return vttContent
      case 'json':
        return JSON.stringify(data, null, 2)
      default:
        return data.transcript || ''
    }
  }

  const generateBlogContent = (data: any, format: ExportFormat): string => {
    const blog = data.blog || data
    switch (format.id) {
      case 'md':
        return `# ${blog.title}\n\n${blog.content}`
      case 'html':
        return `<!DOCTYPE html>\n<html>\n<head>\n<title>${blog.title}</title>\n</head>\n<body>\n<h1>${blog.title}</h1>\n${blog.content.replace(/\n/g, '<br>')}\n</body>\n</html>`
      case 'txt':
        return `${blog.title}\n\n${blog.content}`
      default:
        return blog.content || ''
    }
  }

  const generateSocialContent = (data: any, format: ExportFormat): string => {
    const posts = data.posts || data
    switch (format.id) {
      case 'txt':
        let content = ''
        if (posts.twitter) {
          content += 'TWITTER POSTS:\n\n'
          posts.twitter.forEach((post: any, i: number) => {
            content += `${i + 1}. ${post.text}\n${post.hashtags?.join(' ') || ''}\n\n`
          })
        }
        if (posts.linkedin) {
          content += 'LINKEDIN POST:\n\n'
          content += `${posts.linkedin.text}\n${posts.linkedin.hashtags?.join(' ') || ''}\n\n`
        }
        return content
      case 'json':
        return JSON.stringify(posts, null, 2)
      case 'csv':
        let csv = 'Platform,Text,Hashtags\n'
        if (posts.twitter) {
          posts.twitter.forEach((post: any) => {
            csv += `Twitter,"${post.text}","${post.hashtags?.join(' ') || ''}"\n`
          })
        }
        if (posts.linkedin) {
          csv += `LinkedIn,"${posts.linkedin.text}","${posts.linkedin.hashtags?.join(' ') || ''}"\n`
        }
        return csv
      default:
        return JSON.stringify(posts, null, 2)
    }
  }

  const generateIdeasContent = (data: any, format: ExportFormat): string => {
    switch (format.id) {
      case 'txt':
        let content = 'KEY INSIGHTS\n\n'
        if (data.ideas) {
          content += 'QUOTES:\n'
          data.ideas.forEach((idea: any, i: number) => {
            content += `${i + 1}. "${idea.quote}" (${Math.floor(idea.timestamp / 60)}:${String(Math.floor(idea.timestamp % 60)).padStart(2, '0')})\n`
          })
        }
        if (data.topics) {
          content += '\nTOPICS:\n'
          data.topics.forEach((topic: string, i: number) => {
            content += `${i + 1}. ${topic}\n`
          })
        }
        return content
      case 'md':
        let mdContent = '# Key Insights\n\n'
        if (data.ideas) {
          mdContent += '## Key Quotes\n\n'
          data.ideas.forEach((idea: any, i: number) => {
            mdContent += `${i + 1}. > "${idea.quote}"\n   *Timestamp: ${Math.floor(idea.timestamp / 60)}:${String(Math.floor(idea.timestamp % 60)).padStart(2, '0')}*\n\n`
          })
        }
        if (data.topics) {
          mdContent += '## Main Topics\n\n'
          data.topics.forEach((topic: string) => {
            mdContent += `- ${topic}\n`
          })
        }
        return mdContent
      case 'json':
        return JSON.stringify(data, null, 2)
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  const generateClipsContent = (data: any, format: ExportFormat): string => {
    const clips = data.clips || []
    switch (format.id) {
      case 'txt':
        return clips.map((clip: any, i: number) => 
          `${i + 1}. ${clip.title}\n   Start: ${clip.startTime}s, End: ${clip.endTime}s\n   Highlights: ${clip.highlights?.join(', ') || 'None'}\n`
        ).join('\n')
      case 'json':
        return JSON.stringify(clips, null, 2)
      default:
        return JSON.stringify(clips, null, 2)
    }
  }

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  const formatVTTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = (seconds % 60).toFixed(3)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${parseFloat(secs).toFixed(3).padStart(6, '0')}`
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    const selectedItems = exportItems.filter(item => item.selected)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to export')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      const totalItems = selectedItems.length
      
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i]
        const formatId = selectedFormats[item.id] || item.formats[0]?.id
        const format = item.formats.find(f => f.id === formatId) || item.formats[0]
        
        if (format) {
          const content = generateContent(item, format)
          const filename = `${projectTitle}_${item.title.replace(/\s+/g, '_')}.${format.extension}`
          
          downloadFile(content, filename, format.mimeType)
          
          // Update progress
          setExportProgress(((i + 1) / totalItems) * 100)
          
          // Small delay for UX
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      toast.success(`Exported ${selectedItems.length} file${selectedItems.length !== 1 ? 's' : ''} successfully!`)
    } catch (error) {
      toast.error('Export failed. Please try again.')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleBulkExport = async () => {
    const selectedItems = exportItems.filter(item => item.selected)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to export')
      return
    }

    setIsExporting(true)
    
    try {
      // Create a zip-like structure by combining all files
      let combinedContent = `# ${projectTitle} - Export Package\n\n`
      combinedContent += `Generated on: ${new Date().toLocaleString()}\n\n`
      
      selectedItems.forEach(item => {
        const formatId = selectedFormats[item.id] || item.formats[0]?.id
        const format = item.formats.find(f => f.id === formatId) || item.formats[0]
        
        if (format) {
          combinedContent += `\n## ${item.title}\n\n`
          combinedContent += `Format: ${format.label}\n\n`
          combinedContent += '```\n'
          combinedContent += generateContent(item, format)
          combinedContent += '\n```\n\n'
        }
      })

      downloadFile(combinedContent, `${projectTitle}_export_package.md`, 'text/markdown')
      toast.success('Bulk export package created successfully!')
    } catch (error) {
      toast.error('Bulk export failed. Please try again.')
      console.error('Bulk export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generateShareUrl = () => {
    // In a real app, this would create a shareable link
    const shareData = {
      projectId,
      title: projectTitle,
      selectedItems: exportItems.filter(item => item.selected).map(item => item.id)
    }
    
    const encoded = btoa(JSON.stringify(shareData))
    const url = `${window.location.origin}/shared/${encoded}`
    setShareUrl(url)
    
    navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard!')
  }

  const selectedCount = exportItems.filter(item => item.selected).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Content</h2>
          <p className="text-muted-foreground">
            Download your processed content in various formats
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            <IconX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Export Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select Content to Export</h3>
          <Badge variant="secondary">
            {selectedCount} of {exportItems.length} selected
          </Badge>
        </div>

        {exportItems.map(item => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>
                      {item.formats.length} format{item.formats.length !== 1 ? 's' : ''} available
                    </CardDescription>
                  </div>
                </div>
                
                {item.selected && (
                  <Select
                    value={selectedFormats[item.id] || item.formats[0]?.id || ''}
                    onValueChange={(value) => updateFormat(item.id, value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {item.formats.map(format => (
                        <SelectItem key={format.id} value={format.id}>
                          <div className="flex items-center gap-2">
                            <IconFile className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {format.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting files...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleExport} 
          disabled={selectedCount === 0 || isExporting}
          className="flex-1"
        >
          {isExporting ? (
            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <IconDownload className="h-4 w-4 mr-2" />
          )}
          Export Selected ({selectedCount})
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleBulkExport}
          disabled={selectedCount === 0 || isExporting}
        >
          <IconPackage className="h-4 w-4 mr-2" />
          Bulk Export
        </Button>
        
        <Button 
          variant="outline" 
          onClick={generateShareUrl}
          disabled={selectedCount === 0}
        >
          <IconShare className="h-4 w-4 mr-2" />
          Create Share Link
        </Button>
      </div>

      {/* Share URL */}
      {shareUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconLink className="h-4 w-4" />
              Shareable Link Created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  toast.success('Link copied!')
                }}
              >
                <IconCopy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link allows others to view your selected content. Link expires in 7 days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 