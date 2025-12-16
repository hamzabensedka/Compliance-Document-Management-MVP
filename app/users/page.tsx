'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getCurrentUser, checkUserRole } from '@/lib/utils/auth'
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Shield,
  Building2,
  MapPin,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { UserProfile, Organization, UserRole } from '@/types/database'

type UserWithOrg = Omit<UserProfile, 'organization'> & {
  organization?: Organization | null
}

const roleLabels: Record<UserRole, string> = {
  admin: 'System Admin',
  org_admin: 'Organization Admin',
  site_manager: 'Site Manager',
}

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  org_admin: 'bg-blue-100 text-blue-800 border-blue-200',
  site_manager: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithOrg[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithOrg | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    checkAccess()
    loadData()
  }, [])

  const checkAccess = async () => {
    const hasAccess = await checkUserRole(['admin'])
    if (!hasAccess) {
      router.push('/dashboard')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersResult, orgsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select(`
            *,
            organization:organizations(*)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('organizations')
          .select('*')
          .order('name')
      ])

      if (usersResult.error) throw usersResult.error
      if (orgsResult.error) throw orgsResult.error

      setUsers(usersResult.data || [])
      setOrganizations(orgsResult.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleEditUser = (user: UserWithOrg) => {
    setSelectedUser(user)
    setShowEditModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteClick = (user: UserWithOrg) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', selectedUser.id)

      if (error) throw error

      setUsers(users.filter(u => u.id !== selectedUser.id))
      setSuccess('User deleted successfully')
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError('Failed to delete user')
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
            <h1 className="text-2xl font-bold text-text-primary mb-1">Users</h1>
            <p className="text-text-secondary">Manage system users and their permissions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
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

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[180px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">System Admin</option>
              <option value="org_admin">Organization Admin</option>
              <option value="site_manager">Site Manager</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-text-secondary mb-4 opacity-50" />
              <p className="text-text-secondary">
                {searchQuery || roleFilter !== 'all' 
                  ? 'No users match your filters' 
                  : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-sm">
                            {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-text-secondary">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleBadgeColors[user.role]}`}>
                          <Shield className="w-3 h-3" />
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.organization ? (
                          <div className="flex items-center gap-2 text-sm text-text-primary">
                            <Building2 className="w-4 h-4 text-text-secondary" />
                            {user.organization.name}
                          </div>
                        ) : (
                          <span className="text-sm text-text-secondary">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-text-secondary" />
                          </button>
                          {actionMenuOpen === user.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActionMenuOpen(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit User
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete User
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-purple-700">System Admins</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {users.filter(u => u.role === 'org_admin').length}
                </p>
                <p className="text-sm text-blue-700">Org Admins</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900">
                  {users.filter(u => u.role === 'site_manager').length}
                </p>
                <p className="text-sm text-emerald-700">Site Managers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          organizations={organizations}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newUser) => {
            setUsers([newUser, ...users])
            setSuccess('User created successfully')
            setShowCreateModal(false)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          organizations={organizations}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
            setSuccess('User updated successfully')
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Delete User</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete <strong>{selectedUser.full_name || selectedUser.email}</strong>? 
              This will remove their profile and access to the system.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// Create User Modal Component
function CreateUserModal({ 
  organizations,
  onClose, 
  onSuccess,
  onError 
}: { 
  organizations: Organization[]
  onClose: () => void
  onSuccess: (user: UserWithOrg) => void
  onError: (message: string) => void
}) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'site_manager' as UserRole,
    organization_id: '',
  })
  const [saving, setSaving] = useState(false)

  const supabase = createSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      onError('Email and password are required')
      return
    }

    if (formData.password.length < 6) {
      onError('Password must be at least 6 characters')
      return
    }

    setSaving(true)

    try {
      // Create the auth user via API route
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      onSuccess(result.user)
    } catch (err: any) {
      console.error('Failed to create user:', err)
      onError(err.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Add New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Password <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="••••••••"
              minLength={6}
              required
            />
            <p className="text-xs text-text-secondary mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Role <span className="text-danger">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="site_manager">Site Manager</option>
              <option value="org_admin">Organization Admin</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          {(formData.role === 'org_admin' || formData.role === 'site_manager') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Organization {formData.role === 'org_admin' && <span className="text-danger">*</span>}
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                required={formData.role === 'org_admin'}
              >
                <option value="">Select organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit User Modal Component
function EditUserModal({ 
  user,
  organizations,
  onClose, 
  onSuccess,
  onError 
}: { 
  user: UserWithOrg
  organizations: Organization[]
  onClose: () => void
  onSuccess: (user: UserWithOrg) => void
  onError: (message: string) => void
}) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: user.role,
    organization_id: user.organization_id || '',
  })
  const [saving, setSaving] = useState(false)

  const supabase = createSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData: any = {
        full_name: formData.full_name || null,
        role: formData.role,
        organization_id: formData.organization_id || null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single()

      if (error) throw error

      onSuccess(data)
    } catch (err: any) {
      console.error('Failed to update user:', err)
      onError(err.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Edit User</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-gray-50 text-text-secondary cursor-not-allowed"
            />
            <p className="text-xs text-text-secondary mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="site_manager">Site Manager</option>
              <option value="org_admin">Organization Admin</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          {(formData.role === 'org_admin' || formData.role === 'site_manager') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Organization {formData.role === 'org_admin' && <span className="text-danger">*</span>}
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                required={formData.role === 'org_admin'}
              >
                <option value="">Select organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

