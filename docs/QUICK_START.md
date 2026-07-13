# Quick Start Guide

Get the Compliance Document Management Portal up and running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

## Step 2: Set Up Supabase (5 minutes)

### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to initialize (2-3 minutes)

### 2.2 Run Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Run these files in order (copy/paste contents):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/004_seed_data.sql`

### 2.3 Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"**
3. Name: `compliance-documents`
4. **Uncheck** "Public bucket" (must be private)
5. Click **"Create bucket"**

### 2.4 Get API Keys

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep secret!)

## Step 3: Configure Environment (1 minute)

Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Create Admin User (2 minutes)

### Option A: Via Dashboard

1. **Authentication** > **Users** > **Add User**
   - Email: `admin@example.com`
   - Password: `SecurePassword123!`
   - ✅ Auto Confirm User
   - Copy the **User UID**

2. **Table Editor** > `user_profiles` > **Insert row**
   - **id**: Paste User UID
   - **email**: `admin@example.com`
   - **role**: `admin`
   - **full_name**: `Admin User`

### Option B: Via SQL

```sql
-- After creating auth user via Dashboard:
INSERT INTO user_profiles (id, email, role, full_name)
SELECT id, email, 'admin', 'Admin User'
FROM auth.users
WHERE email = 'admin@example.com';
```

## Step 5: Run Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Log In

- Email: `admin@example.com`
- Password: `SecurePassword123!` (or whatever you set)

## ✅ You're Done!

You should now see the dashboard. Next steps:

1. **Create Test Data**:
   - Add an organization in `organizations` table
   - Add a site in `sites` table
   - Upload a test document

2. **Create More Users**:
   - See `ADMIN_SETUP_GUIDE.md` for creating org admins and site managers

3. **Deploy to Production**:
   - See `DEPLOYMENT_GUIDE.md` for Vercel deployment

## Troubleshooting

### "Invalid API key"
- Check `.env.local` file exists
- Verify keys are correct (no extra spaces)
- Restart dev server after changing env vars

### "User profile not found"
- Make sure you created the user_profile entry
- Check that user ID matches between auth.users and user_profiles

### "Storage bucket not found"
- Verify bucket name is exactly `compliance-documents`
- Check bucket is created and not deleted

### Can't log in
- Check user exists in `auth.users`
- Verify `email_confirmed_at` is set (auto-confirm should handle this)
- Check user_profile exists with correct role

## Need Help?

- **Full Documentation**: See `README.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **User Management**: See `ADMIN_SETUP_GUIDE.md`
- **Testing**: See `MANUAL_TEST_CHECKLIST.md`

---

**Time to first login: ~10 minutes** ⚡

