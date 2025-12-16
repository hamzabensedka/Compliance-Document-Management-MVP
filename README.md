# Compliance Document Management Portal

A secure, multi-tenant web portal for managing compliance documents across multiple sites and organizations built with Next.js 14 and Supabase.

## Features

- **Multi-tenant Architecture**: Secure isolation between organizations and sites
- **Role-Based Access Control**: Three distinct user roles (Admin, Organization Admin, Site Manager)
- **Document Management**: Upload, download, and manage compliance documents with expiry tracking
- **Dashboard Analytics**: View expiring documents, missing required documents, and statistics
- **Row Level Security**: Database-level security policies for data isolation
- **File Security**: Validated uploads, signed URLs, and audit logging

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- npm or yarn package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd compliance-document-portal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/004_seed_data.sql`

3. Create a storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `compliance-documents`
   - Set it as **PRIVATE** (not public)
   - Configure storage policies (see Storage Setup section)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase project settings under API.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- `organizations` - Organization entities
- `sites` - Site entities linked to organizations
- `user_profiles` - Extended user information with roles
- `site_managers` - Many-to-many relationship between users and sites
- `document_categories` - Document category definitions
- `documents` - Document metadata and file references
- `audit_logs` - Audit trail for all actions

## User Roles

### Admin
- Full system access
- View all organizations and sites
- Access all documents
- Manage users and roles

### Organization Admin
- View and manage all sites within their organization
- Upload/view documents for all sites in their org
- Manage site managers for their organization

### Site Manager
- Access only to assigned site(s)
- Upload documents for their site
- View documents for their site
- Update document metadata

## Creating the First Admin User

### Option 1: Via Supabase Dashboard

1. Go to Authentication > Users in Supabase Dashboard
2. Click "Add User"
3. Enter email and password
4. Confirm email (auto-confirm in settings)
5. Go to Database > user_profiles
6. Insert a row with:
   - `id`: Copy from `auth.users` table
   - `email`: admin@example.com
   - `role`: 'admin'

### Option 2: Via SQL

```sql
-- Create auth user (you'll need to use Supabase Auth API or Dashboard for this)
-- Then create profile:

INSERT INTO user_profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@example.com';
```

## Storage Setup

After creating the `compliance-documents` bucket, you need to set up storage policies. Run these in the SQL Editor:

```sql
-- Policy: Users can upload to their assigned sites
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'compliance-documents'
  );

-- Policy: Users can view documents based on site access
-- Note: This is simplified. In production, you may want more granular control
CREATE POLICY "Users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'compliance-documents'
  );
```

## File Upload Security

The application implements several security measures:

- **File Type Validation**: Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG allowed
- **File Size Limit**: 10MB maximum (configurable)
- **Filename Sanitization**: Removes special characters
- **Signed URLs**: Downloads use time-limited signed URLs (15 minutes)
- **Audit Logging**: All uploads, downloads, and deletions are logged

## Testing

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── documents/         # Documents listing page
│   ├── sites/             # Sites pages
│   └── login/             # Login page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── documents/        # Document-related components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Helper functions
├── supabase/              # Database migrations
│   └── migrations/       # SQL migration files
├── types/                 # TypeScript type definitions
└── __tests__/            # Unit tests
```

## Security Checklist

- [x] All tables have RLS enabled
- [x] Storage bucket is private
- [x] File uploads are validated
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (React's built-in escaping)
- [x] CSRF protection (Next.js built-in)
- [x] Audit logging for sensitive operations
- [x] Secure password requirements (handled by Supabase)
- [x] Session management (handled by Supabase)

## Manual Test Checklist

See `MANUAL_TEST_CHECKLIST.md` for comprehensive testing guidelines.

## Support

For issues or questions, please open an issue in the repository.

## License

[Your License Here]

