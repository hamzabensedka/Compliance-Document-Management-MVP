'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/utils/auth'
import Button from '@/components/ui/Button'
import { 
  MapPin, 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import type { Site, Organization, UserProfile } from '@/types/database'

type SiteWithStats = Omit<Site, 'organization'> & {
  organization?: Organization | null
  documents_count: number
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteWithStats[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSite, setSelectedSite] = useState<SiteWithStats | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadCurrentUser()
    loadData()
  }, [])

  const loadCurrentUser = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [sitesResult, orgsResult] = await Promise.all([
        supabase
          .from('sites')
          .select(`
            *,
            organization:organizations(*),
            documents(id)
          `)
          .order('name'),
        supabase
          .from('organizations')
          .select('*')
          .order('name')
      ])

      if (sitesResult.error) throw sitesResult.error
      if (orgsResult.error) throw orgsResult.error

      const sitesWithStats: SiteWithStats[] = (sitesResult.data || []).map((site: any) => ({
        ...site,
        documents_count: site.documents?.length || 0,
        documents: undefined,
      }))

      setSites(sitesWithStats)
      setOrganizations(orgsResult.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load sites')
    } finally {
      setLoading(false)
    }
  }

  const filteredSites = sites.filter((site) => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesOrg = orgFilter === '' || site.organization_id === orgFilter
    return matchesSearch && matchesOrg
  })

  const canManageSites = currentUser?.role === 'admin' || currentUser?.role === 'org_admin'

  const handleEditSite = (site: SiteWithStats) => {
    setSelectedSite(site)
    setShowEditModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteClick = (site: SiteWithStats) => {
    setSelectedSite(site)
    setShowDeleteModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteSite = async () => {
    if (!selectedSite) return

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', selectedSite.id)

      if (error) throw error

      setSites(sites.filter(s => s.id !== selectedSite.id))
      setSuccess('Site deleted successfully')
      setShowDeleteModal(false)
      setSelectedSite(null)
    } catch (err: any) {
      console.error('Failed to delete site:', err)
      setError(err.message || 'Failed to delete site')
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Sites</h1>
            <p className="text-text-secondary">View and manage your sites</p>
          </div>
          {canManageSites && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
            <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
            <button onClick={clearMessages} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[200px]"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sites Grid */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading sites...
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-text-secondary mb-4 opacity-50" />
            <p className="text-text-secondary mb-4">
              {searchQuery || orgFilter ? 'No sites match your filters' : 'No sites yet'}
            </p>
            {canManageSites && !searchQuery && !orgFilter && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create First Site
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSites.map((site) => (
              <div key={site.id} className="card hover:shadow-card-hover transition-shadow relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  {canManageSites && (
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === site.id ? null : site.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-5 h-5 text-text-secondary" />
                      </button>
                      {actionMenuOpen === site.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                            <button
                              onClick={() => handleEditSite(site)}
                              className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Site
                            </button>
                            <button
                              onClick={() => handleDeleteClick(site)}
                              className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Site
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Link href={`/sites/${site.id}`} className="block">
                  <h3 className="text-lg font-semibold text-text-primary mb-1 hover:text-primary transition-colors">
                    {site.name}
                  </h3>
                </Link>
                
                {site.organization && (
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-2">
                    <Building2 className="w-4 h-4" />
                    {site.organization.name}
                  </div>
                )}

                {site.address && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {site.address}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <FileText className="w-4 h-4" />
                    {site.documents_count} document{site.documents_count !== 1 ? 's' : ''}
                  </div>
                  <Link 
                    href={`/sites/${site.id}`}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <SiteFormModal
          organizations={organizations}
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newSite) => {
            const org = organizations.find(o => o.id === newSite.organization_id)
            setSites([...sites, { ...newSite, organization: org, documents_count: 0 }])
            setSuccess('Site created successfully')
            setShowCreateModal(false)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSite && (
        <SiteFormModal
          site={selectedSite}
          organizations={organizations}
          currentUser={currentUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedSite(null)
          }}
          onSuccess={(updatedSite) => {
            const org = organizations.find(o => o.id === updatedSite.organization_id)
            setSites(sites.map(s => 
              s.id === updatedSite.id 
                ? { ...updatedSite, organization: org, documents_count: selectedSite.documents_count }
                : s
            ))
            setSuccess('Site updated successfully')
            setShowEditModal(false)
            setSelectedSite(null)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Delete Site</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-text-secondary mb-2">
              Are you sure you want to delete <strong>{selectedSite.name}</strong>?
            </p>
            {selectedSite.documents_count > 0 && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm mb-4">
                <strong>Warning:</strong> This will also delete {selectedSite.documents_count} document(s) 
                associated with this site.
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedSite(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteSite}>
                Delete Site
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// Site Form Modal
function SiteFormModal({ 
  site,
  organizations,
  currentUser,
  onClose, 
  onSuccess,
  onError 
}: { 
  site?: SiteWithStats | Site
  organizations: Organization[]
  currentUser: UserProfile | null
  onClose: () => void
  onSuccess: (site: Site) => void
  onError: (message: string) => void
}) {
  const [formData, setFormData] = useState({
    name: site?.name || '',
    address: site?.address || '',
    organization_id: site?.organization_id || (currentUser?.role === 'org_admin' ? currentUser.organization_id : '') || '',
  })
  const [saving, setSaving] = useState(false)

  const supabase = createSupabaseClient()
  const isEdit = !!site

  // Filter organizations for org_admin
  const availableOrgs = currentUser?.role === 'org_admin' 
    ? organizations.filter(o => o.id === currentUser.organization_id)
    : organizations

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      onError('Site name is required')
      return
    }

    if (!formData.organization_id) {
      onError('Organization is required')
      return
    }

    setSaving(true)

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('sites')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            organization_id: formData.organization_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', site.id)
          .select()
          .single()

        if (error) throw error
        onSuccess(data)
      } else {
        const { data, error } = await supabase
          .from('sites')
          .insert({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            organization_id: formData.organization_id,
          })
          .select()
          .single()

        if (error) throw error
        onSuccess(data)
      }
    } catch (err: any) {
      console.error('Failed to save site:', err)
      onError(err.message || 'Failed to save site')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">
            {isEdit ? 'Edit Site' : 'New Site'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Site Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter site name"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Organization <span className="text-danger">*</span>
            </label>
            <select
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              required
              disabled={currentUser?.role === 'org_admin'}
            >
              <option value="">Select organization...</option>
              {availableOrgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter site address (optional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Site'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
