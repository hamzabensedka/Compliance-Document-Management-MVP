import { createSupabaseClient, createSupabaseAdmin } from '@/lib/supabase/client'
import { validateFileType, validateFileSize, sanitizeFileName, MAX_FILE_SIZE } from './validation'
import type { Document } from '@/types/database'

export interface UploadDocumentParams {
  file: File
  siteId: string
  categoryId?: string
  expiryDate?: string
  notes?: string
}

export async function uploadDocument(params: UploadDocumentParams): Promise<Document> {
  const { file, siteId, categoryId, expiryDate, notes } = params
  const supabase = createSupabaseClient()

  // 1. Validate file type
  if (!validateFileType(file)) {
    throw new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG')
  }

  // 2. Validate file size
  if (!validateFileSize(file)) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }

  // 3. Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // 4. Verify user has access to this site
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('User profile not found')
  }

  // Check access based on role
  if (profile.role === 'site_manager') {
    const { data: siteManager } = await supabase
      .from('site_managers')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .single()

    if (!siteManager) {
      throw new Error('Access denied: You do not have permission to upload to this site')
    }
  } else if (profile.role === 'org_admin') {
    const { data: site } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single()

    if (!site || site.organization_id !== profile.organization_id) {
      throw new Error('Access denied: You do not have permission to upload to this site')
    }
  }
  // Admin role has access to all sites, no check needed

  // 5. Sanitize filename
  const sanitizedName = sanitizeFileName(file.name)

  // 6. Generate secure file path
  const fileExtension = sanitizedName.split('.').pop() || 'pdf'
  const uniqueId = crypto.randomUUID()
  const filePath = `${siteId}/${uniqueId}.${fileExtension}`

  // 7. Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('compliance-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`)
  }

  // 8. Save metadata to database
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      site_id: siteId,
      category_id: categoryId || null,
      file_name: sanitizedName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
      expiry_date: expiryDate || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (docError) {
    // Rollback storage upload if DB insert fails
    await supabase.storage.from('compliance-documents').remove([filePath])
    throw new Error(`Database insert failed: ${docError.message}`)
  }

  // 9. Create audit log
  await createAuditLog('upload', 'document', docData.id, {
    file_name: sanitizedName,
    site_id: siteId,
  })

  return docData
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const supabase = createSupabaseClient()

  // Get document metadata
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('file_path, site_id')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    throw new Error('Document not found')
  }

  // Verify access (RLS will handle this, but we check explicitly for audit)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  // Generate signed URL (15 minutes expiry)
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('compliance-documents')
    .createSignedUrl(document.file_path, 900) // 15 minutes

  if (urlError || !signedUrlData) {
    throw new Error('Failed to generate download URL')
  }

  // Create audit log
  await createAuditLog('download', 'document', documentId, {
    file_path: document.file_path,
    site_id: document.site_id,
  })

  return signedUrlData.signedUrl
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = createSupabaseClient()

  // Get document metadata
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('file_path, site_id')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    throw new Error('Document not found')
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('compliance-documents')
    .remove([document.file_path])

  if (storageError) {
    throw new Error(`Storage deletion failed: ${storageError.message}`)
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) {
    throw new Error(`Database deletion failed: ${dbError.message}`)
  }

  // Create audit log
  await createAuditLog('delete', 'document', documentId, {
    file_path: document.file_path,
    site_id: document.site_id,
  })
}

async function createAuditLog(
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('audit_logs').insert({
    user_id: user?.id || null,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details: details || {},
  })
}

