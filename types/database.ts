export type UserRole = 'admin' | 'org_admin' | 'site_manager'

export interface Organization {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Site {
  id: string
  organization_id: string
  name: string
  address?: string
  created_at: string
  updated_at: string
  organization?: Organization
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: UserRole
  organization_id?: string
  created_at: string
  updated_at: string
  organization?: Organization
}

export interface SiteManager {
  id: string
  user_id: string
  site_id: string
  created_at: string
  site?: Site
  user?: UserProfile
}

export interface DocumentCategory {
  id: string
  name: string
  description?: string
  is_required: boolean
  created_at: string
}

export interface Document {
  id: string
  site_id: string
  category_id?: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  uploaded_at: string
  expiry_date?: string
  notes?: string
  created_at: string
  updated_at: string
  site?: Site
  category?: DocumentCategory
  uploader?: UserProfile
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
  user?: UserProfile
}

