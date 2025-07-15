import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixProfiles() {
  console.log('🔍 Checking for duplicate user profiles...\n');

  // Get all profiles grouped by clerk_user_id
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  // Group profiles by clerk_user_id
  const profilesByUserId = profiles.reduce((acc, profile) => {
    if (!acc[profile.clerk_user_id]) {
      acc[profile.clerk_user_id] = [];
    }
    acc[profile.clerk_user_id].push(profile);
    return acc;
  }, {});

  // Find duplicates
  const duplicates = Object.entries(profilesByUserId).filter(([_, profiles]) => profiles.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate profiles found!');
    return;
  }

  console.log(`Found ${duplicates.length} users with duplicate profiles:\n`);

  // Fix duplicates
  for (const [userId, userProfiles] of duplicates) {
    console.log(`Clerk User ID: ${userId}`);
    console.log(`  - Found ${userProfiles.length} profiles`);
    
    // Keep the oldest profile (first created)
    const [keepProfile, ...toDelete] = userProfiles;
    
    console.log(`  - Keeping profile created at: ${keepProfile.created_at}`);
    console.log(`  - Deleting ${toDelete.length} duplicate(s)`);

    // Delete duplicates
    for (const profile of toDelete) {
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profile.id);

      if (deleteError) {
        console.error(`  ❌ Error deleting profile ${profile.id}:`, deleteError);
      } else {
        console.log(`  ✅ Deleted profile ${profile.id}`);
      }
    }
    console.log('');
  }

  console.log('✨ Cleanup complete!');
  
  // Show current user's profile
  const currentUserId = 'user_2yVSdRQqqdcwhFtAv3X0x1D93MT';
  const { data: currentProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', currentUserId)
    .single();

  if (currentProfile) {
    console.log('\n📋 Your current profile:');
    console.log(`  - Clerk User ID: ${currentProfile.clerk_user_id}`);
    console.log(`  - Full Name: ${currentProfile.full_name}`);
    console.log(`  - Email: ${currentProfile.email}`);
    console.log(`  - Onboarding: ${currentProfile.onboarding_completed ? 'Completed' : 'Not completed'}`);
  }
}

checkAndFixProfiles().catch(console.error); 