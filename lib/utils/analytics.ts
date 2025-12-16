import { createSupabaseClient } from '@/lib/supabase/client'
import type { Document, Site, DocumentCategory } from '@/types/database'

export interface ExpiringDocument extends Document {
  site: Site
  category?: DocumentCategory
}

export interface MissingDocument {
  site_id: string
  site_name: string
  organization_name?: string
  missing_documents: DocumentCategory[]
}

export async function getExpiringDocuments(days: 30 | 60 | 90): Promise<ExpiringDocument[]> {
  const supabase = createSupabaseClient()
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + days)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      sites (
        id,
        name,
        organization_id,
        organizations (
          id,
          name
        )
      ),
      document_categories (
        id,
        name,
        description
      )
    `)
    .lte('expiry_date', targetDate.toISOString().split('T')[0])
    .gte('expiry_date', today.toISOString().split('T')[0])
    .not('expiry_date', 'is', null)
    .order('expiry_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch expiring documents: ${error.message}`)
  }

  return (data || []) as ExpiringDocument[]
}

export async function getMissingDocuments(): Promise<MissingDocument[]> {
  const supabase = createSupabaseClient()

  // Get all required categories
  const { data: requiredCategories, error: catError } = await supabase
    .from('document_categories')
    .select('id, name, description')
    .eq('is_required', true)

  if (catError) {
    throw new Error(`Failed to fetch required categories: ${catError.message}`)
  }

  if (!requiredCategories || requiredCategories.length === 0) {
    return []
  }

  // Get all sites with their documents
  const { data: sitesWithDocs, error: sitesError } = await supabase
    .from('sites')
    .select(`
      id,
      name,
      organizations (
        id,
        name
      ),
      documents (
        category_id
      )
    `)

  if (sitesError) {
    throw new Error(`Failed to fetch sites: ${sitesError.message}`)
  }

  if (!sitesWithDocs) {
    return []
  }

  // Calculate missing documents
  const results: MissingDocument[] = sitesWithDocs
    .map((site: any) => {
      const uploadedCategories = new Set(
        (site.documents || []).map((d: { category_id: string }) => d.category_id)
      )
      const missing = requiredCategories.filter(
        (cat: { id: string; name: string; description: string | null }) => !uploadedCategories.has(cat.id)
      )

      if (missing.length > 0) {
        return {
          site_id: site.id,
          site_name: site.name,
          organization_name: site.organizations?.name,
          missing_documents: missing,
        }
      }
      return null
    })
    .filter((r: MissingDocument | null): r is MissingDocument => r !== null)

  return results
}

export async function getDashboardStats() {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  // Get user profile to determine access scope
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('User profile not found')
  }

  let totalDocsQuery = supabase.from('documents').select('id', { count: 'exact', head: true })
  let expiringQuery = supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .not('expiry_date', 'is', null)
  let todayUploadsQuery = supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .gte('uploaded_at', new Date().toISOString().split('T')[0])

  // Apply role-based filtering
  if (profile.role === 'org_admin' && profile.organization_id) {
    const { data: orgSites } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', profile.organization_id)

    const siteIds = orgSites?.map((s: { id: string }) => s.id) || []
    if (siteIds.length > 0) {
      totalDocsQuery = totalDocsQuery.in('site_id', siteIds)
      expiringQuery = expiringQuery.in('site_id', siteIds)
      todayUploadsQuery = todayUploadsQuery.in('site_id', siteIds)
    } else {
      // No sites in org, return zeros
      return {
        totalDocuments: 0,
        expiringSoon: 0,
        uploadedToday: 0,
        totalSites: 0,
      }
    }
  } else if (profile.role === 'site_manager') {
    const { data: managedSites } = await supabase
      .from('site_managers')
      .select('site_id')
      .eq('user_id', user.id)

    const siteIds = managedSites?.map((s: { site_id: string }) => s.site_id) || []
    if (siteIds.length > 0) {
      totalDocsQuery = totalDocsQuery.in('site_id', siteIds)
      expiringQuery = expiringQuery.in('site_id', siteIds)
      todayUploadsQuery = todayUploadsQuery.in('site_id', siteIds)
    } else {
      return {
        totalDocuments: 0,
        expiringSoon: 0,
        uploadedToday: 0,
        totalSites: siteIds.length,
      }
    }
  }

  const [totalDocs, expiring, todayUploads, sitesCount] = await Promise.all([
    totalDocsQuery,
    expiringQuery,
    todayUploadsQuery,
    profile.role === 'admin'
      ? supabase.from('sites').select('id', { count: 'exact', head: true })
      : profile.role === 'org_admin' && profile.organization_id
      ? supabase.from('sites').select('id', { count: 'exact', head: true }).eq('organization_id', profile.organization_id)
      : supabase
          .from('site_managers')
          .select('site_id', { count: 'exact', head: true })
          .eq('user_id', user.id),
  ])

  return {
    totalDocuments: totalDocs.count || 0,
    expiringSoon: expiring.count || 0,
    uploadedToday: todayUploads.count || 0,
    totalSites: sitesCount.count || 0,
  }
}

