# Admin Setup Guide

This guide explains how to create and manage admin users in the Compliance Document Management Portal.

## Creating the First Admin User

### Method 1: Via Supabase Dashboard (Recommended)

1. **Create Auth User**
   - Go to Supabase Dashboard > **Authentication** > **Users**
   - Click **"Add User"** > **"Create new user"**
   - Enter:
     - **Email**: `admin@yourcompany.com`
     - **Password**: Generate a strong, secure password
     - **Auto Confirm User**: ✅ Check this box (important!)
   - Click **"Create user"**
   - Copy the **User UID** (you'll need this in the next step)

2. **Create User Profile**
   - Go to **Table Editor** > `user_profiles`
   - Click **"Insert row"** or use the **"Insert"** button
   - Fill in the form:
     - **id**: Paste the User UID from step 1
     - **email**: `admin@yourcompany.com` (same as auth user)
     - **role**: Select `admin` from dropdown
     - **full_name**: `Admin User` (optional but recommended)
   - Click **"Save"**

3. **Verify Setup**
   - Try logging in at your application URL
   - Use the email and password from step 1
   - You should be redirected to the dashboard
   - You should see "Admin" role in the sidebar

### Method 2: Via SQL (Advanced)

If you prefer using SQL directly:

```sql
-- Step 1: Create the auth user first via Supabase Dashboard or Auth API
-- (Supabase doesn't allow direct INSERT into auth.users for security)

-- Step 2: Create the profile (replace 'admin@yourcompany.com' with your email)
INSERT INTO user_profiles (id, email, role, full_name)
SELECT 
  id, 
  email, 
  'admin',
  'Admin User'
FROM auth.users
WHERE email = 'admin@yourcompany.com';
```

**Note**: You must create the auth user first via the Dashboard or Auth API. The SQL method only creates the profile.

## Creating Organization Admin Users

### Step 1: Create Organization

1. Go to **Table Editor** > `organizations`
2. Click **"Insert row"**
3. Enter:
   - **name**: `Your Organization Name`
4. Click **"Save"**
5. Copy the **Organization ID**

### Step 2: Create Auth User

Follow the same steps as creating an admin user (Method 1, Step 1)

### Step 3: Create User Profile

1. Go to **Table Editor** > `user_profiles`
2. Click **"Insert row"**
3. Fill in:
   - **id**: User UID from auth.users
   - **email**: User's email
   - **role**: `org_admin`
   - **organization_id**: Paste the Organization ID from Step 1
   - **full_name**: User's full name
4. Click **"Save"**

### Step 4: Create Sites (Optional)

If you want to create sites for this organization:

1. Go to **Table Editor** > `sites`
2. Click **"Insert row"**
3. Enter:
   - **organization_id**: The Organization ID
   - **name**: `Site Name`
   - **address**: `Site Address` (optional)
4. Click **"Save"**

## Creating Site Manager Users

### Step 1: Create Auth User

Follow the same steps as creating an admin user (Method 1, Step 1)

### Step 2: Create User Profile

1. Go to **Table Editor** > `user_profiles`
2. Click **"Insert row"**
3. Fill in:
   - **id**: User UID from auth.users
   - **email**: User's email
   - **role**: `site_manager`
   - **full_name**: User's full name
   - **organization_id**: Leave empty (site managers don't need org_id)
4. Click **"Save"**

### Step 3: Assign Sites

1. Go to **Table Editor** > `site_managers`
2. Click **"Insert row"**
3. Enter:
   - **user_id**: The User UID from step 1
   - **site_id**: The Site ID (get this from the `sites` table)
4. Click **"Save"**
5. Repeat for each site this manager should have access to

## Bulk User Creation (SQL)

If you need to create multiple users, you can use this SQL template:

```sql
-- First, create auth users via Dashboard or Auth API
-- Then create profiles in bulk:

INSERT INTO user_profiles (id, email, role, organization_id, full_name)
VALUES
  ('user-uuid-1', 'admin1@example.com', 'admin', NULL, 'Admin One'),
  ('user-uuid-2', 'orgadmin1@example.com', 'org_admin', 'org-uuid', 'Org Admin One'),
  ('user-uuid-3', 'sitemanager1@example.com', 'site_manager', NULL, 'Site Manager One');

-- Assign site managers to sites:
INSERT INTO site_managers (user_id, site_id)
VALUES
  ('user-uuid-3', 'site-uuid-1'),
  ('user-uuid-3', 'site-uuid-2');
```

## Managing Users

### Change User Role

1. Go to **Table Editor** > `user_profiles`
2. Find the user
3. Click on the row to edit
4. Change the **role** field
5. Click **"Save"**

### Assign Additional Sites to Site Manager

1. Go to **Table Editor** > `site_managers`
2. Click **"Insert row"**
3. Enter the **user_id** and **site_id**
4. Click **"Save"**

### Remove Site Access

1. Go to **Table Editor** > `site_managers`
2. Find the row with the user_id and site_id
3. Click the delete/trash icon
4. Confirm deletion

### Deactivate User

**Option 1: Delete from auth.users** (removes access completely)
- Go to **Authentication** > **Users**
- Find the user
- Click the delete icon
- This will cascade delete the user_profile (due to ON DELETE CASCADE)

**Option 2: Keep auth user, remove profile** (user can't log in)
- Go to **Table Editor** > `user_profiles`
- Delete the profile row
- User will not be able to log in (no profile = access denied)

## Default Credentials Template

After creating the first admin user, document the credentials securely:

```
Admin Credentials:
- Email: admin@yourcompany.com
- Password: [Generated securely - store in password manager]
- Role: admin
- Created: [Date]
- Created by: [Your name]
```

**⚠️ Security Warning**: 
- Change the default password immediately after first login
- Use a password manager to store credentials securely
- Never share admin credentials via email or unsecured channels
- Enable 2FA if available in Supabase

## Troubleshooting

### User can't log in

**Check:**
1. User exists in `auth.users` table
2. User has corresponding entry in `user_profiles` table
3. User ID matches between both tables
4. User's email is confirmed (check `email_confirmed_at` in auth.users)

### "User profile not found" error

- Verify `user_profiles` table has an entry for the user
- Check that the `id` in `user_profiles` matches the `id` in `auth.users`
- Ensure the user was created correctly

### User can't see expected data

- Verify the user's role is correct
- For org_admin: Check `organization_id` is set correctly
- For site_manager: Check `site_managers` table has entries for the user
- Verify RLS policies are working (check Supabase logs)

### Can't assign site to manager

- Verify the site exists in `sites` table
- Check that the user_id exists in `user_profiles`
- Ensure the user has role `site_manager`
- Check for duplicate entries (should be unique per user_id + site_id)

## Best Practices

1. **Use Strong Passwords**: Minimum 12 characters, mix of letters, numbers, symbols
2. **Document Everything**: Keep a secure record of all admin users created
3. **Regular Audits**: Periodically review user_profiles table for accuracy
4. **Principle of Least Privilege**: Only grant admin access when necessary
5. **Separate Accounts**: Don't share admin accounts between team members
6. **Monitor Access**: Review audit_logs regularly for suspicious activity

## Next Steps

After creating admin users:
1. Test login with each role
2. Verify permissions are working correctly
3. Create test organizations and sites
4. Test document upload/download
5. Review dashboard functionality
6. Set up additional users as needed

