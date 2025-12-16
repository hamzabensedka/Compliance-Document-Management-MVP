-- Note: Storage bucket creation must be done via Supabase Dashboard or API
-- This file documents the required storage configuration

-- Storage bucket: 'compliance-documents'
-- Should be created as PRIVATE bucket
-- RLS policies for storage.objects are set up below

-- Storage RLS Policies (run these after creating the bucket)
-- Note: These policies reference the documents table to verify access

-- Policy: Authenticated users can upload documents to their assigned sites
-- Note: This is a simplified version. In practice, you may need to verify
-- site access through the documents table or a separate validation step

-- Policy: Users can view documents based on site access
-- This policy checks if the user has access to the site associated with the document
-- The file path structure should be: {site_id}/{file_id}.{ext}

