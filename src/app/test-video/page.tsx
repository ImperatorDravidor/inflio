"use client"

import { useState, useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function TestVideoPage() {
  const [projects, setProjects] = useState<any[]>([])
  
  useEffect(() => {
    async function loadProjects() {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .limit(5)
      
      if (data) {
        setProjects(data)
        console.log('Loaded projects:', data)
      }
    }
    
    loadProjects()
  }, [])
  
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Video Test Page</h1>
      
      {projects.map((project) => (
        <div key={project.id} className="border p-4 rounded space-y-4">
          <h2 className="font-bold">{project.title}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Raw video element */}
            <div>
              <h3 className="text-sm font-medium mb-2">Raw Video Element</h3>
              <video 
                src={project.video_url}
                controls
                className="w-full bg-black"
                preload="metadata"
              />
              <p className="text-xs mt-1 text-gray-500">URL: {project.video_url}</p>
            </div>
            
            {/* Video with poster */}
            <div>
              <h3 className="text-sm font-medium mb-2">With Thumbnail Poster</h3>
              <video 
                src={project.video_url}
                poster={project.thumbnail_url}
                controls
                className="w-full bg-black"
                preload="metadata"
              />
              <p className="text-xs mt-1 text-gray-500">Thumbnail: {project.thumbnail_url || 'none'}</p>
            </div>
          </div>
        </div>
      ))}
      
      {projects.length === 0 && (
        <p className="text-gray-500">Loading projects...</p>
      )}
    </div>
  )
}
