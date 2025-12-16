'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createSupabaseClient } from '@/lib/supabase/client'
import { checkUserRole } from '@/lib/utils/auth'
import Button from '@/components/ui/Button'
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  Check,
  AlertCircle,
  MapPin
} from 'lucide-react'
import type { Organization, Site } from '@/types/database'

interface OrgWithStats extends Organization {
  sites_count: number
  users_count: number
}

export default function OrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrgWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<OrgWithStats | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    checkAccess()
    loadOrganizations()
  }, [])

  const checkAccess = async () => {
    const hasAccess = await checkUserRole(['admin'])
    if (!hasAccess) {
      router.push('/dashboard')
    }
  }

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      
      // Get organizations with site count
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          sites (id),
          user_profiles (id)
        `)
        .order('name')

      if (orgsError) throw orgsError

      const orgsWithStats: OrgWithStats[] = (orgs || []).map((org: any) => ({
        ...org,
        sites_count: org.sites?.length || 0,
        users_count: org.user_profiles?.length || 0,
        sites: undefined,
        user_profiles: undefined,
      }))

      setOrganizations(orgsWithStats)
    } catch (err) {
      console.error('Failed to load organizations:', err)
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditOrg = (org: OrgWithStats) => {
    setSelectedOrg(org)
    setShowEditModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteClick = (org: OrgWithStats) => {
    setSelectedOrg(org)
    setShowDeleteModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', selectedOrg.id)

      if (error) throw error

      setOrganizations(organizations.filter(o => o.id !== selectedOrg.id))
      setSuccess('Organization deleted successfully')
      setShowDeleteModal(false)
      setSelectedOrg(null)
    } catch (err: any) {
      console.error('Failed to delete organization:', err)
      setError(err.message || 'Failed to delete organization')
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
            <h1 className="text-2xl font-bold text-text-primary mb-1">Organizations</h1>
            <p className="text-text-secondary">Manage organizations and their sites</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
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

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading organizations...
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-text-secondary mb-4 opacity-50" />
            <p className="text-text-secondary mb-4">
              {searchQuery ? 'No organizations match your search' : 'No organizations yet'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create First Organization
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrgs.map((org) => (
              <div key={org.id} className="card hover:shadow-card-hover transition-shadow relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === org.id ? null : org.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-text-secondary" />
                    </button>
                    {actionMenuOpen === org.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                          <button
                            onClick={() => handleEditOrg(org)}
                            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(org)}
                            className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-2">{org.name}</h3>
                
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {org.sites_count} site{org.sites_count !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {org.users_count} user{org.users_count !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border text-xs text-text-secondary">
                  Created {new Date(org.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <OrgFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newOrg) => {
            setOrganizations([...organizations, { ...newOrg, sites_count: 0, users_count: 0 }])
            setSuccess('Organization created successfully')
            setShowCreateModal(false)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrg && (
        <OrgFormModal
          org={selectedOrg}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOrg(null)
          }}
          onSuccess={(updatedOrg) => {
            setOrganizations(organizations.map(o => 
              o.id === updatedOrg.id 
                ? { ...updatedOrg, sites_count: selectedOrg.sites_count, users_count: selectedOrg.users_count }
                : o
            ))
            setSuccess('Organization updated successfully')
            setShowEditModal(false)
            setSelectedOrg(null)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Delete Organization</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-text-secondary mb-2">
              Are you sure you want to delete <strong>{selectedOrg.name}</strong>?
            </p>
            {(selectedOrg.sites_count > 0 || selectedOrg.users_count > 0) && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm mb-4">
                <strong>Warning:</strong> This will also delete {selectedOrg.sites_count} site(s) and 
                unassign {selectedOrg.users_count} user(s) from this organization.
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedOrg(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteOrg}>
                Delete Organization
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// Organization Form Modal
function OrgFormModal({ 
  org,
  onClose, 
  onSuccess,
  onError 
}: { 
  org?: Organization
  onClose: () => void
  onSuccess: (org: Organization) => void
  onError: (message: string) => void
}) {
  const [name, setName] = useState(org?.name || '')
  const [saving, setSaving] = useState(false)

  const supabase = createSupabaseClient()
  const isEdit = !!org

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      onError('Organization name is required')
      return
    }

    setSaving(true)

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('organizations')
          .update({ name: name.trim(), updated_at: new Date().toISOString() })
          .eq('id', org.id)
          .select()
          .single()

        if (error) throw error
        onSuccess(data)
      } else {
        const { data, error } = await supabase
          .from('organizations')
          .insert({ name: name.trim() })
          .select()
          .single()

        if (error) throw error
        onSuccess(data)
      }
    } catch (err: any) {
      console.error('Failed to save organization:', err)
      onError(err.message || 'Failed to save organization')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">
            {isEdit ? 'Edit Organization' : 'New Organization'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Organization Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter organization name"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

