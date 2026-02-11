import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, created_at } = evt.data

    const userData = {
      id: id,
      email: email_addresses[0]?.email_address || '',
      firstName: first_name,
      lastName: last_name,
      imageUrl: image_url,
      createdAt: new Date(created_at).toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(userData, { onConflict: 'id' })

      if (error) {
        console.error('Error syncing user to Supabase:', error)
        return new Response('Error syncing user', { status: 500 })
      }

      // For new users, create an initial profile record
      if (eventType === 'user.created') {
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            clerk_user_id: id,
            email: email_addresses[0]?.email_address || '',
            full_name: `${first_name || ''} ${last_name || ''}`.trim(),
            onboarding_completed: false,
            onboarding_step: 0
          })

        if (profileError) {
          console.error('Error creating initial user profile:', profileError)
          // Don't fail the webhook if profile creation fails
        } else {
          console.log(`Initial profile created for user ${id}`)
        }
      }

      console.log(`User ${id} synced successfully`)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response('Error processing webhook', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete user's projects first (if not using CASCADE)
      await supabaseAdmin
        .from('projects')
        .delete()
        .eq('user_id', id)

      // Then delete the user
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting user from Supabase:', error)
        return new Response('Error deleting user', { status: 500 })
      }

      console.log(`User ${id} deleted successfully`)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response('Error processing webhook', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
} 
