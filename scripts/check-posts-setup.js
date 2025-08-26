#!/usr/bin/env node

/**
 * Script to check if the posts feature is properly set up
 * This checks for:
 * 1. Required database tables
 * 2. OpenAI API key configuration
 * 3. Supabase connection
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

async function checkPostsSetup() {
  console.log('🔍 Checking Posts Feature Setup...\n')

  // Check environment variables
  console.log('1. Checking environment variables:')
  
  const requiredEnvVars = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  let hasAllEnvVars = true
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === 'your_openai_api_key_here') {
      console.log(`  ❌ ${key}: Missing or invalid`)
      hasAllEnvVars = false
    } else {
      console.log(`  ✅ ${key}: Configured`)
    }
  }

  if (!hasAllEnvVars) {
    console.log('\n⚠️  Missing environment variables. Please configure them in .env.local')
  }

  // Check database tables
  console.log('\n2. Checking database tables:')
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    )

    const requiredTables = [
      'post_suggestions',
      'post_images',
      'post_copy',
      'post_generation_jobs'
    ]

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`  ❌ ${table}: Table does not exist`)
          } else {
            console.log(`  ⚠️  ${table}: ${error.message}`)
          }
        } else {
          console.log(`  ✅ ${table}: Table exists`)
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Error checking table - ${err.message}`)
      }
    }

    // Check for update_updated_at function
    console.log('\n3. Checking database functions:')
    try {
      const { data, error } = await supabase.rpc('get_platform_requirements')
      if (error) {
        console.log(`  ❌ get_platform_requirements: Function does not exist`)
      } else {
        console.log(`  ✅ get_platform_requirements: Function exists`)
      }
    } catch (err) {
      console.log(`  ⚠️  Unable to check functions`)
    }
  } else {
    console.log('  ⚠️  Cannot check database - Supabase credentials missing')
  }

  console.log('\n📝 Next Steps:')
  console.log('1. If tables are missing, run the migration:')
  console.log('   npx supabase db push --file migrations/posts-feature-mvp.sql')
  console.log('2. If OpenAI API key is missing, add it to .env.local:')
  console.log('   OPENAI_API_KEY=your_actual_api_key')
  console.log('3. Restart your development server after making changes')
}

checkPostsSetup().catch(console.error)

