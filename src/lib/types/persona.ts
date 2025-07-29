export interface PersonaPhoto {
  id: string
  url: string
  name: string
  uploadedAt: Date
}

export interface Persona {
  id: string
  name: string
  description?: string
  photos: PersonaPhoto[]
  isGlobal: boolean // Global personas available across all projects
  projectId?: string // Project-specific personas
  userId: string
  createdAt: Date
  updatedAt: Date
  metadata?: {
    style?: string
    promptTemplate?: string
    keywords?: string[]
  }
}

export interface PersonaCreateInput {
  name: string
  description?: string
  photos: PersonaPhoto[]
  isGlobal?: boolean
  projectId?: string
  metadata?: Persona['metadata']
}

export interface PersonaUpdateInput {
  name?: string
  description?: string
  photos?: PersonaPhoto[]
  metadata?: Persona['metadata']
} 