import { supabaseAdmin } from '@/lib/supabase/admin'
import { currentUser, auth } from '@clerk/nextjs/server'

export interface SupabaseUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export async function syncUserToSupabase(userId: string): Promise<SupabaseUser | null> {
  try {
    const user = await currentUser()
    
    if (!user) {
      console.error('No user found for ID:', userId)
      return null
    }

    const supabaseUser: SupabaseUser = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(supabaseUser, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('Error syncing user to Supabase:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in syncUserToSupabase:', error)
    return null
  }
}

export async function ensureUserExists(): Promise<SupabaseUser | null> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }

    // Check if user already exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return existingUser
    }

    // If not, sync from Clerk
    return syncUserToSupabase(userId)
  } catch (error) {
    console.error('Error in ensureUserExists:', error)
    return null
  }
}

export async function getUserProjects(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching user projects:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserProjects:', error)
    return []
  }
}

export async function deleteUserData(userId: string) {
  try {
    // Delete all user's projects first
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('userId', userId)

    if (projectsError) {
      console.error('Error deleting user projects:', projectsError)
    }

    // Then delete the user
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.error('Error deleting user:', userError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteUserData:', error)
    return false
  }
} 
