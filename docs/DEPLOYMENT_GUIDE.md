# Deployment Guide

This guide will walk you through deploying the Compliance Document Management Portal to production.

## Prerequisites

- Node.js 18+ installed locally
- Supabase account with a project created
- Vercel account (or your preferred hosting platform)
- GitHub account (for code repository)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: Compliance Portal (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 1.2 Run Database Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Run migrations in order:

   **Migration 1: Initial Schema**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

   **Migration 2: RLS Policies**
   - Open `supabase/migrations/002_rls_policies.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

   **Migration 3: Seed Data**
   - Open `supabase/migrations/004_seed_data.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

3. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `organizations`, `sites`, `user_profiles`, `site_managers`, `document_categories`, `documents`, `audit_logs`

### 1.3 Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click "New bucket"
3. Configure:
   - **Name**: `compliance-documents`
   - **Public bucket**: **UNCHECKED** (must be private)
4. Click "Create bucket"

### 1.4 Set Up Storage Policies

1. Go to **Storage** > **Policies** > `compliance-documents`
2. Click "New Policy"
3. Create upload policy:
   - **Policy name**: "Users can upload documents"
   - **Allowed operation**: INSERT
   - **Policy definition**: 
   ```sql
   bucket_id = 'compliance-documents'
   ```
4. Create select policy:
   - **Policy name**: "Users can view documents"
   - **Allowed operation**: SELECT
   - **Policy definition**:
   ```sql
   bucket_id = 'compliance-documents'
   ```

### 1.5 Get API Keys

1. Go to **Settings** > **API**
2. Copy the following values (you'll need these for environment variables):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 2: Create First Admin User

### Option A: Via Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click "Add User" > "Create new user"
3. Enter:
   - **Email**: admin@yourcompany.com
   - **Password**: Generate a strong password
   - **Auto Confirm User**: Check this box
4. Click "Create user"
5. Copy the user's UUID from the users table
6. Go to **Table Editor** > `user_profiles`
7. Click "Insert row"
8. Fill in:
   - **id**: Paste the UUID from step 5
   - **email**: admin@yourcompany.com
   - **role**: `admin`
   - **full_name**: Admin User (optional)
9. Click "Save"

### Option B: Via SQL

1. Go to **SQL Editor**
2. Run this query (replace email and password):

```sql
-- First, create the auth user via Supabase Auth API or Dashboard
-- Then create the profile:

INSERT INTO user_profiles (id, email, role, full_name)
SELECT id, email, 'admin', 'Admin User'
FROM auth.users
WHERE email = 'admin@yourcompany.com';
```

## Step 3: Prepare Code for Deployment

### 3.1 Push to GitHub

1. Initialize git repository (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push code:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

### 3.2 Verify Environment Variables

Make sure `.env.example` is in the repository (it should be, as it's not in `.gitignore`).

## Step 4: Deploy to Vercel

### 4.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Select the repository

### 4.2 Configure Build Settings

Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 4.3 Add Environment Variables

In the "Environment Variables" section, add:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` should be kept secret (but Vercel handles this)
- Add these for all environments (Production, Preview, Development)

### 4.4 Deploy

1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 5: Post-Deployment Checklist

### 5.1 Test Authentication

- [ ] Visit your deployed URL
- [ ] Should redirect to `/login`
- [ ] Log in with admin credentials
- [ ] Should redirect to `/dashboard`

### 5.2 Test Basic Functionality

- [ ] Dashboard loads and shows statistics
- [ ] Sites page loads
- [ ] Documents page loads
- [ ] Can upload a test document
- [ ] Can download the test document
- [ ] Can delete the test document

### 5.3 Verify Security

- [ ] Try accessing `/dashboard` without logging in (should redirect)
- [ ] Test RLS by creating a test user with limited access
- [ ] Verify file uploads work
- [ ] Check audit logs are being created

### 5.4 Set Up Custom Domain (Optional)

1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` environment variable if using NextAuth

## Step 6: Create Additional Users

### Create Organization Admin

1. Create user in Supabase Auth
2. Create organization in `organizations` table
3. Create sites linked to that organization
4. Insert into `user_profiles`:
   ```sql
   INSERT INTO user_profiles (id, email, role, organization_id, full_name)
   VALUES ('user-uuid', 'orgadmin@example.com', 'org_admin', 'org-uuid', 'Org Admin');
   ```

### Create Site Manager

1. Create user in Supabase Auth
2. Insert into `user_profiles`:
   ```sql
   INSERT INTO user_profiles (id, email, role, full_name)
   VALUES ('user-uuid', 'sitemanager@example.com', 'site_manager', 'Site Manager');
   ```
3. Assign to site(s):
   ```sql
   INSERT INTO site_managers (user_id, site_id)
   VALUES ('user-uuid', 'site-uuid');
   ```

## Troubleshooting

### Issue: "Invalid API key"

- Verify environment variables are set correctly in Vercel
- Check that you're using the correct keys from Supabase
- Make sure `NEXT_PUBLIC_` prefix is on public variables

### Issue: "RLS policy violation"

- Verify RLS policies were run correctly
- Check user profile exists and has correct role
- Verify user has access to the resource they're trying to access

### Issue: "Storage bucket not found"

- Verify bucket name is exactly `compliance-documents`
- Check bucket is created and not deleted
- Verify storage policies are set up

### Issue: "User profile not found"

- Make sure user exists in `auth.users`
- Verify corresponding entry in `user_profiles` table
- Check that user ID matches between tables

## Monitoring and Maintenance

### Monitor Supabase Usage

- Check Supabase Dashboard for database size
- Monitor storage usage
- Review API request counts

### Regular Backups

- Supabase provides automatic backups
- Consider exporting data periodically for additional safety

### Update Dependencies

```bash
npm update
npm audit fix
```

### Database Migrations

When adding new migrations:
1. Test locally first
2. Run in Supabase SQL Editor
3. Commit migration file to repository
4. Document changes

## Security Best Practices

1. **Never commit** `.env.local` or `.env` files
2. **Rotate** `SUPABASE_SERVICE_ROLE_KEY` periodically
3. **Use** strong passwords for admin accounts
4. **Enable** Supabase's built-in security features
5. **Monitor** audit logs regularly
6. **Review** RLS policies periodically
7. **Keep** dependencies updated

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console for errors
4. Verify all environment variables are set

## Next Steps

After successful deployment:
1. Create user documentation
2. Set up monitoring/alerting
3. Configure backup strategy
4. Plan for scaling (if needed)
5. Set up CI/CD pipeline (optional)

