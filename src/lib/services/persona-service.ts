import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Persona, PersonaCreateInput, PersonaUpdateInput, PersonaPhoto } from '@/lib/types/persona'

export class PersonaService {
  private supabase = createSupabaseBrowserClient()

  /**
   * Get all personas for a user (global and project-specific)
   */
  async getPersonas(userId: string, projectId?: string): Promise<Persona[]> {
    try {
      let query = this.supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)

      // Get global personas and project-specific ones
      if (projectId) {
        query = query.or(`is_global.eq.true,project_id.eq.${projectId}`)
      } else {
        // Only global personas if no project specified
        query = query.eq('is_global', true)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(this.formatPersona)
    } catch (error) {
      console.error('Error fetching personas:', error)
      return []
    }
  }

  /**
   * Get a single persona by ID
   */
  async getPersona(personaId: string): Promise<Persona | null> {
    try {
      const { data, error } = await this.supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single()

      if (error) throw error
      if (!data) return null

      return this.formatPersona(data)
    } catch (error) {
      console.error('Error fetching persona:', error)
      return null
    }
  }

  /**
   * Create a new persona
   */
  async createPersona(userId: string, input: PersonaCreateInput): Promise<Persona | null> {
    try {
      const { data, error } = await this.supabase
        .from('personas')
        .insert({
          user_id: userId,
          name: input.name,
          description: input.description,
          photos: input.photos,
          is_global: input.isGlobal ?? false,
          project_id: input.projectId,
          metadata: input.metadata || {}
        })
        .select()
        .single()

      if (error) throw error
      if (!data) return null

      return this.formatPersona(data)
    } catch (error) {
      console.error('Error creating persona:', error)
      throw error
    }
  }

  /**
   * Update an existing persona
   */
  async updatePersona(personaId: string, input: PersonaUpdateInput): Promise<Persona | null> {
    try {
      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.photos !== undefined) updateData.photos = input.photos
      if (input.metadata !== undefined) updateData.metadata = input.metadata

      const { data, error } = await this.supabase
        .from('personas')
        .update(updateData)
        .eq('id', personaId)
        .select()
        .single()

      if (error) throw error
      if (!data) return null

      return this.formatPersona(data)
    } catch (error) {
      console.error('Error updating persona:', error)
      throw error
    }
  }

  /**
   * Delete a persona
   */
  async deletePersona(personaId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('personas')
        .delete()
        .eq('id', personaId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting persona:', error)
      return false
    }
  }

  /**
   * Upload a photo for a persona
   */
  async uploadPersonaPhoto(file: File, personaId: string): Promise<PersonaPhoto | null> {
    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      const photo: PersonaPhoto = {
        id: crypto.randomUUID(),
        url: base64,
        name: file.name,
        uploadedAt: new Date()
      }

      return photo
    } catch (error) {
      console.error('Error uploading persona photo:', error)
      return null
    }
  }

  /**
   * Format persona data from database
   */
  private formatPersona(data: any): Persona {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      photos: data.photos || [],
      isGlobal: data.is_global,
      projectId: data.project_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata || {}
    }
  }

  /**
   * Clone a global persona to a project
   */
  async cloneToProject(personaId: string, projectId: string, userId: string): Promise<Persona | null> {
    try {
      const original = await this.getPersona(personaId)
      if (!original) return null

      return this.createPersona(userId, {
        name: `${original.name} (Project)`,
        description: original.description,
        photos: original.photos,
        isGlobal: false,
        projectId,
        metadata: original.metadata
      })
    } catch (error) {
      console.error('Error cloning persona:', error)
      return null
    }
  }
} 