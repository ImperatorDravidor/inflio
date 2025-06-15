"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconSearch,
  IconFilter,
  IconX,
  IconClock,
  IconFile,
  IconVideo,
  IconSortAscending,
  IconSortDescending
} from "@tabler/icons-react"

interface SearchFilters {
  query: string
  status: string[]
  duration: {
    min: number
    max: number
  }
  fileSize: {
    min: number
    max: number
  }
  formats: string[]
  outputs: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void
  resultCount?: number
  isLoading?: boolean
}

const defaultFilters: SearchFilters = {
  query: '',
  status: [],
  duration: { min: 0, max: 3600 }, // 0 to 60 minutes in seconds
  fileSize: { min: 0, max: 2000 }, // 0 to 2GB in MB
  formats: [],
  outputs: [],
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

export function AdvancedSearch({ onFiltersChange, resultCount, isLoading }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Calculate active filters count
  useEffect(() => {
    let count = 0
    if (filters.query) count++
    if (filters.status.length > 0) count++
    if (filters.duration.min > 0 || filters.duration.max < 3600) count++
    if (filters.fileSize.min > 0 || filters.fileSize.max < 2000) count++
    if (filters.formats.length > 0) count++
    if (filters.outputs.length > 0) count++
    setActiveFiltersCount(count)
  }, [filters])

  // Debounced filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'status' | 'formats' | 'outputs', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  const formatFileSize = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)}GB`
    return `${mb}MB`
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects by title, description, or content..."
            className="pl-10 pr-4"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
          />
        </div>
        
        <Button
          variant={showAdvanced ? "default" : "outline"}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="relative"
        >
          <IconFilter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <IconX className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.query}"
              <button 
                onClick={() => updateFilter('query', '')}
                aria-label={`Remove search filter: ${filters.query}`}
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status}
              <button 
                onClick={() => toggleArrayFilter('status', status)}
                aria-label={`Remove status filter: ${status}`}
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.formats.map(format => (
            <Badge key={format} variant="secondary" className="gap-1">
              Format: {format}
              <button 
                onClick={() => toggleArrayFilter('formats', format)}
                aria-label={`Remove format filter: ${format}`}
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.outputs.map(output => (
            <Badge key={output} variant="secondary" className="gap-1">
              Output: {output}
              <button 
                onClick={() => toggleArrayFilter('outputs', output)}
                aria-label={`Remove output filter: ${output}`}
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {['completed', 'processing', 'queued', 'failed'].map(status => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleArrayFilter('status', status)}
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Duration Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                Duration: {formatDuration(filters.duration.min)} - {formatDuration(filters.duration.max)}
              </Label>
              <div className="px-2">
                <Slider
                  value={[filters.duration.min, filters.duration.max]}
                  onValueChange={([min, max]) => updateFilter('duration', { min, max })}
                  max={3600}
                  min={0}
                  step={60}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* File Size Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <IconFile className="h-4 w-4" />
                File Size: {formatFileSize(filters.fileSize.min)} - {formatFileSize(filters.fileSize.max)}
              </Label>
              <div className="px-2">
                <Slider
                  value={[filters.fileSize.min, filters.fileSize.max]}
                  onValueChange={([min, max]) => updateFilter('fileSize', { min, max })}
                  max={2000}
                  min={0}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Format Filter */}
            <div className="space-y-2">
              <Label>Video Format</Label>
              <div className="flex flex-wrap gap-2">
                {['MP4', 'MOV', 'AVI', 'WEBM'].map(format => (
                  <label key={format} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.formats.includes(format)}
                      onCheckedChange={() => toggleArrayFilter('formats', format)}
                    />
                    <span className="text-sm">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Output Types */}
            <div className="space-y-2">
              <Label>Available Outputs</Label>
              <div className="flex flex-wrap gap-2">
                {['transcription', 'clips', 'blog', 'social', 'ideas'].map(output => (
                  <label key={output} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={filters.outputs.includes(output)}
                      onCheckedChange={() => toggleArrayFilter('outputs', output)}
                    />
                    <span className="text-sm capitalize">{output}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="fileSize">File Size</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Order</Label>
                <Button
                  variant="outline"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full justify-start"
                >
                  {filters.sortOrder === 'asc' ? (
                    <IconSortAscending className="mr-2 h-4 w-4" />
                  ) : (
                    <IconSortDescending className="mr-2 h-4 w-4" />
                  )}
                  {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <IconVideo className="h-4 w-4" />
          {isLoading ? 'Searching...' : `${resultCount} project${resultCount !== 1 ? 's' : ''} found`}
        </div>
      )}
    </div>
  )
}

// Search utility functions
export function filterProjects(projects: any[], filters: SearchFilters) {
  return projects.filter(project => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      const searchableText = `${project.title} ${project.description || ''}`.toLowerCase()
      if (!searchableText.includes(query)) return false
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(project.status)) {
      return false
    }

    // Duration filter (convert project duration to seconds)
    if (project.duration) {
      const [minutes, seconds] = project.duration.split(':').map(Number)
      const totalSeconds = minutes * 60 + (seconds || 0)
      if (totalSeconds < filters.duration.min || totalSeconds > filters.duration.max) {
        return false
      }
    }

    // Format filter
    if (filters.formats.length > 0 && !filters.formats.includes(project.format)) {
      return false
    }

    // Output types filter
    if (filters.outputs.length > 0) {
      const hasRequiredOutput = filters.outputs.some(output => {
        switch (output) {
          case 'transcription': return project.outputs?.transcription
          case 'clips': return project.outputs?.clips > 0
          case 'blog': return project.outputs?.blog
          case 'social': return project.outputs?.social
          case 'ideas': return project.outputs?.ideas
          default: return false
        }
      })
      if (!hasRequiredOutput) return false
    }

    return true
  })
}

export function sortProjects(projects: any[], sortBy: string, sortOrder: 'asc' | 'desc') {
  return [...projects].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'title':
        aValue = a.title?.toLowerCase() || ''
        bValue = b.title?.toLowerCase() || ''
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'duration':
        aValue = parseDuration(a.duration) || 0
        bValue = parseDuration(b.duration) || 0
        break
      case 'fileSize':
        aValue = parseFileSize(a.fileSize) || 0
        bValue = parseFileSize(b.fileSize) || 0
        break
      case 'status':
        aValue = a.status || ''
        bValue = b.status || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}

function parseDuration(duration: string): number {
  if (!duration) return 0
  const [minutes, seconds] = duration.split(':').map(Number)
  return minutes * 60 + (seconds || 0)
}

function parseFileSize(fileSize: string): number {
  if (!fileSize) return 0
  const match = fileSize.match(/^([\d.]+)\s*(KB|MB|GB)$/i)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  switch (unit) {
    case 'KB': return value / 1024
    case 'MB': return value
    case 'GB': return value * 1024
    default: return value
  }
} 
