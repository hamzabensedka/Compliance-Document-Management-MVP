'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createSupabaseClient } from '@/lib/supabase/client'
import { checkUserRole } from '@/lib/utils/auth'
import { 
  ClipboardList, 
  Search, 
  Filter,
  Upload,
  Download,
  Trash2,
  Eye,
  UserPlus,
  Edit,
  LogIn,
  LogOut
} from 'lucide-react'
import type { AuditLog, UserProfile } from '@/types/database'

interface AuditLogWithUser extends AuditLog {
  user?: UserProfile | null
}

const actionIcons: Record<string, React.ReactNode> = {
  upload: <Upload className="w-4 h-4" />,
  download: <Download className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
  create: <UserPlus className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
}

const actionColors: Record<string, string> = {
  upload: 'bg-emerald-100 text-emerald-700',
  download: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  view: 'bg-gray-100 text-gray-700',
  create: 'bg-purple-100 text-purple-700',
  update: 'bg-amber-100 text-amber-700',
  login: 'bg-cyan-100 text-cyan-700',
  logout: 'bg-slate-100 text-slate-700',
}

export default function AuditLogPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLogWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')

  const supabase = createSupabaseClient()

  useEffect(() => {
    checkAccess()
    loadLogs()
  }, [])

  const checkAccess = async () => {
    const hasAccess = await checkUserRole(['admin'])
    if (!hasAccess) {
      router.push('/dashboard')
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_profiles(id, email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      searchQuery === '' ||
      log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesAction = actionFilter === '' || log.action === actionFilter
    const matchesResource = resourceFilter === '' || log.resource_type === resourceFilter
    
    return matchesSearch && matchesAction && matchesResource
  })

  const uniqueActions = [...new Set(logs.map(l => l.action))]
  const uniqueResources = [...new Set(logs.map(l => l.resource_type))]

  const formatDetails = (details: Record<string, unknown> | null | undefined) => {
    if (!details || Object.keys(details).length === 0) return '—'
    
    return Object.entries(details)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(', ')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Audit Log</h1>
          <p className="text-text-secondary">Track all system activities and changes</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search by user or resource ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Resource</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">All Resources</option>
                {uniqueResources.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50">
            <p className="text-2xl font-bold text-blue-900">{logs.length}</p>
            <p className="text-sm text-blue-700">Total Events</p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <p className="text-2xl font-bold text-emerald-900">
              {logs.filter(l => l.action === 'upload').length}
            </p>
            <p className="text-sm text-emerald-700">Uploads</p>
          </div>
          <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100/50">
            <p className="text-2xl font-bold text-cyan-900">
              {logs.filter(l => l.action === 'download').length}
            </p>
            <p className="text-sm text-cyan-700">Downloads</p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100/50">
            <p className="text-2xl font-bold text-red-900">
              {logs.filter(l => l.action === 'delete').length}
            </p>
            <p className="text-sm text-red-700">Deletions</p>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 mx-auto text-text-secondary mb-4 opacity-50" />
              <p className="text-text-secondary">
                {searchQuery || actionFilter || resourceFilter 
                  ? 'No logs match your filters' 
                  : 'No audit logs yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Resource</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {log.user ? (
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {log.user.full_name || 'No name'}
                            </p>
                            <p className="text-xs text-text-secondary">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-text-secondary">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {actionIcons[log.action] || <Eye className="w-4 h-4" />}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary capitalize">{log.resource_type}</p>
                          <p className="text-xs text-text-secondary font-mono">{log.resource_id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate" title={formatDetails(log.details)}>
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

