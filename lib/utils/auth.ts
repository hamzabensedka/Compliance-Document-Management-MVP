import { createSupabaseClient } from '@/lib/supabase/client'
import type { UserProfile, UserRole } from '@/types/database'

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile || null
}

export async function checkUserRole(allowedRoles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return allowedRoles.includes(user.role)
}

export async function hasSiteAccess(siteId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return false

  // Admin has access to all sites
  if (profile.role === 'admin') return true

  // Org admin has access to sites in their org
  if (profile.role === 'org_admin' && profile.organization_id) {
    const { data: site } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single()

    return site?.organization_id === profile.organization_id
  }

  // Site manager has access to assigned sites
  if (profile.role === 'site_manager') {
    const { data: siteManager } = await supabase
      .from('site_managers')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .single()

    return !!siteManager
  }

  return false
}

