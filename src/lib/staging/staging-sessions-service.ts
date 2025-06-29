import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export interface StagingSessionData {
  ids: string[]
  items: any[]
}

export class StagingSessionsService {
  /**
   * Create or update a staging session
   */
  static async saveStagingSession(
    userId: string,
    projectId: string,
    data: StagingSessionData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // First, delete any existing staging sessions for this user/project
      await supabase
        .from('staging_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId)
      
      // Create new staging session
      const { error } = await supabase
        .from('staging_sessions')
        .insert({
          user_id: userId,
          project_id: projectId,
          selected_content: data,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error saving staging session:', error)
        }
        // Provide more specific error messages
        if (error.code === '42P01') {
          return { success: false, error: 'Staging sessions table not found. Please run database migrations.' }
        }
        return { success: false, error: error.message || 'Failed to save staging session' }
      }
      
      return { success: true }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error in saveStagingSession:', error)
      }
      return { success: false, error: 'Failed to save staging session' }
    }
  }
  
  /**
   * Get the latest staging session for a user/project
   */
  static async getStagingSession(
    userId: string,
    projectId: string
  ): Promise<{ data: StagingSessionData | null; error?: string }> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('staging_sessions')
        .select('id, selected_content')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return { data: null }
        }
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading staging session:', error)
        }
        return { data: null, error: error.message }
      }
      
      return { data: data.selected_content as StagingSessionData }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error in getStagingSession:', error)
      }
      return { data: null, error: 'Failed to load staging session' }
    }
  }
  
  /**
   * Clean up expired staging sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      await supabase
        .from('staging_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error cleaning up expired sessions:', error)
      }
    }
  }
} 