# Clerk Authentication Setup for Inflio

This guide explains how to complete the Clerk authentication setup for your Inflio app.

## What's Already Done

✅ Middleware configured for authentication  
✅ ClerkProvider added to the app  
✅ User sync service created for Supabase  
✅ Webhook handler for user events  
✅ NavUser component integrated with Clerk  
✅ Database schema updated with users table  

## What You Need to Do

### 1. Set Up Clerk Dashboard

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose your authentication methods (Email, Google, GitHub, etc.)

### 2. Add Clerk Environment Variables

Add these to your `.env.local` file (get values from Clerk Dashboard > API Keys):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Set Up Webhook in Clerk

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Set the URL to: `https://your-domain.com/api/webhooks/clerk`
4. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret and add to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### 4. Run Database Migration

Run the auth migration SQL in your Supabase dashboard:

```bash
# The file is: supabase-auth-migration.sql
```

This will:
- Create the `users` table
- Add `userId` column to `projects` table
- Set up proper relationships and indexes

### 5. Create Sign-In and Sign-Up Pages

Create `/src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

Create `/src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

### 6. Test Your Setup

1. Start your dev server: `npm run dev`
2. Visit your app
3. You should be redirected to sign-in
4. Create an account
5. Check Supabase to confirm:
   - User appears in `users` table
   - Projects created by this user have the correct `userId`

## How It Works

1. **Authentication Flow**:
   - Clerk handles all authentication (sign up, sign in, password reset, etc.)
   - Middleware protects routes requiring authentication
   - Public routes: `/`, `/sign-in`, `/sign-up`

2. **User Sync**:
   - When a user signs up, Clerk sends a webhook
   - The webhook handler creates the user in Supabase
   - All projects are linked to the authenticated user

3. **Data Access**:
   - Projects are associated with users via `userId`
   - Users can only see and manage their own projects
   - Supabase RLS policies enforce data isolation (currently permissive for migration)

## Security Considerations

Currently, the RLS policies are permissive to allow for migration. For production:

1. Update the RLS policies in Supabase to properly filter by user:

```sql
-- Example: Users can only see their own projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT
  USING (userId = current_user_id());
```

2. Implement proper API routes that validate user ownership
3. Never expose sensitive operations to client-side code

## Troubleshooting

- **"Unauthorized" errors**: Check that your Clerk API keys are correct
- **Users not syncing**: Verify webhook secret and endpoint URL
- **Can't see projects**: Make sure projects have the correct userId

## Next Steps

1. Customize the sign-in/sign-up pages to match your brand
2. Add social login providers in Clerk Dashboard
3. Implement proper RLS policies for production
4. Add user profile management features 