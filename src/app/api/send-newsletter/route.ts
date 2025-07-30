import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subject, preheader, content, subscribers, config } = body

    // Validate inputs
    if (!subject || !content || !subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user details for from address
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('name, email')
      .eq('user_id', userId)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Send emails in batches (to avoid rate limits)
    const batchSize = 50
    let sentCount = 0
    const errors = []

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      
      try {
        // Send batch using a mock implementation (replace with actual email service)
        // In production, you would use Resend, SendGrid, or another email service
        const emailPromises = batch.map(async (subscriber: any) => {
          // Mock email sending - replace with actual implementation
          console.log(`Sending email to ${subscriber.email}:`, {
            from: `${userProfile.name || 'Newsletter'} <newsletter@inflio.com>`,
            to: subscriber.email,
            subject: subject,
            preview: content.substring(0, 100) + '...'
          })
          
          // Simulate email sending delay
          await new Promise(resolve => setTimeout(resolve, 50))
          
          return { success: true, email: subscriber.email }
        })
        
        const results = await Promise.all(emailPromises)
        const successCount = results.filter(r => r.success).length

        sentCount += successCount
        
        if (successCount < batch.length) {
          errors.push({ 
            batch: i / batchSize, 
            error: `Failed to send ${batch.length - successCount} emails` 
          })
        }

        // Track email sends
        const emailRecords = batch.map((subscriber: any) => ({
          user_id: userId,
          recipient_email: subscriber.email,
          subject: subject,
          sent_at: new Date().toISOString(),
          status: 'sent',
          metadata: {
            batch: i / batchSize,
            track_opens: config.trackOpens,
            track_clicks: config.trackClicks
          }
        }))

        await supabaseAdmin
          .from('email_sends')
          .insert(emailRecords)

      } catch (error) {
        console.error('Batch processing error:', error)
        errors.push({ batch: i / batchSize, error: error instanceof Error ? error.message : 'Unknown error' })
      }

      // Add delay between batches to avoid rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Update newsletter stats
    await supabaseAdmin
      .from('newsletter_stats')
      .insert({
        user_id: userId,
        subject: subject,
        total_recipients: subscribers.length,
        sent_count: sentCount,
        error_count: errors.length,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      sentCount,
      totalRecipients: subscribers.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Newsletter sending error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}

// Helper function to generate unsubscribe token
function generateUnsubscribeToken(email: string): string {
  // In production, use a proper JWT or signed token
  return Buffer.from(`${email}:${process.env.UNSUBSCRIBE_SECRET || 'secret'}`).toString('base64')
}

// Helper function to generate unique email ID
function generateEmailId(userId: string, email: string): string {
  return `${userId}-${email}-${Date.now()}`
} 