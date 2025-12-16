'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createSupabaseClient } from '@/lib/supabase/client'
import { 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Download
} from 'lucide-react'
import type { Site, Document, Organization, DocumentCategory } from '@/types/database'

interface ComplianceStats {
  totalDocuments: number
  expiredDocuments: number
  expiringIn30Days: number
  expiringIn60Days: number
  expiringIn90Days: number
  sitesWithMissingDocs: number
  totalSites: number
  documentsUploadedThisMonth: number
  complianceRate: number
}

interface SiteCompliance {
  id: string
  name: string
  organization_name: string
  total_required: number
  total_uploaded: number
  missing_count: number
  expired_count: number
  compliance_percentage: number
}

interface CategoryStats {
  id: string
  name: string
  is_required: boolean
  total_count: number
  expired_count: number
  expiring_count: number
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [siteCompliance, setSiteCompliance] = useState<SiteCompliance[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'categories'>('overview')

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    try {
      setLoading(true)

      const today = new Date()
      const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const sixtyDays = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
      const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      // Fetch all required data
      const [
        documentsRes,
        sitesRes,
        categoriesRes,
      ] = await Promise.all([
        supabase.from('documents').select('*, sites(id, name, organization_id, organizations(name))'),
        supabase.from('sites').select('*, organizations(name)'),
        supabase.from('document_categories').select('*'),
      ])

      const documents = documentsRes.data || []
      const sites = sitesRes.data || []
      const categories = categoriesRes.data || []
      const requiredCategories = categories.filter(c => c.is_required)

      // Calculate overview stats
      const expiredDocs = documents.filter(d => d.expiry_date && new Date(d.expiry_date) < today)
      const expiring30 = documents.filter(d => 
        d.expiry_date && 
        new Date(d.expiry_date) >= today && 
        new Date(d.expiry_date) <= thirtyDays
      )
      const expiring60 = documents.filter(d => 
        d.expiry_date && 
        new Date(d.expiry_date) >= today && 
        new Date(d.expiry_date) <= sixtyDays
      )
      const expiring90 = documents.filter(d => 
        d.expiry_date && 
        new Date(d.expiry_date) >= today && 
        new Date(d.expiry_date) <= ninetyDays
      )
      const uploadedThisMonth = documents.filter(d => 
        new Date(d.uploaded_at) >= monthStart
      )

      // Calculate sites with missing docs
      const sitesWithMissing = sites.filter(site => {
        const siteDocCategoryIds = new Set(
          documents.filter(d => d.site_id === site.id).map(d => d.category_id)
        )
        return requiredCategories.some(cat => !siteDocCategoryIds.has(cat.id))
      })

      // Calculate compliance rate (sites with all required docs / total sites)
      const compliantSites = sites.length - sitesWithMissing.length
      const complianceRate = sites.length > 0 
        ? Math.round((compliantSites / sites.length) * 100) 
        : 100

      setStats({
        totalDocuments: documents.length,
        expiredDocuments: expiredDocs.length,
        expiringIn30Days: expiring30.length,
        expiringIn60Days: expiring60.length,
        expiringIn90Days: expiring90.length,
        sitesWithMissingDocs: sitesWithMissing.length,
        totalSites: sites.length,
        documentsUploadedThisMonth: uploadedThisMonth.length,
        complianceRate,
      })

      // Calculate per-site compliance
      const siteComplianceData: SiteCompliance[] = sites.map((site: any) => {
        const siteDocs = documents.filter(d => d.site_id === site.id)
        const siteDocCategoryIds = new Set(siteDocs.map(d => d.category_id))
        const missingCount = requiredCategories.filter(cat => !siteDocCategoryIds.has(cat.id)).length
        const expiredCount = siteDocs.filter(d => d.expiry_date && new Date(d.expiry_date) < today).length
        
        const totalRequired = requiredCategories.length
        const uploaded = requiredCategories.filter(cat => siteDocCategoryIds.has(cat.id)).length
        const percentage = totalRequired > 0 ? Math.round((uploaded / totalRequired) * 100) : 100

        return {
          id: site.id,
          name: site.name,
          organization_name: site.organizations?.name || 'N/A',
          total_required: totalRequired,
          total_uploaded: siteDocs.length,
          missing_count: missingCount,
          expired_count: expiredCount,
          compliance_percentage: percentage,
        }
      }).sort((a, b) => a.compliance_percentage - b.compliance_percentage)

      setSiteCompliance(siteComplianceData)

      // Calculate category stats
      const catStats: CategoryStats[] = categories.map(cat => {
        const catDocs = documents.filter(d => d.category_id === cat.id)
        const expired = catDocs.filter(d => d.expiry_date && new Date(d.expiry_date) < today)
        const expiring = catDocs.filter(d => 
          d.expiry_date && 
          new Date(d.expiry_date) >= today && 
          new Date(d.expiry_date) <= thirtyDays
        )

        return {
          id: cat.id,
          name: cat.name,
          is_required: cat.is_required,
          total_count: catDocs.length,
          expired_count: expired.length,
          expiring_count: expiring.length,
        }
      }).sort((a, b) => b.total_count - a.total_count)

      setCategoryStats(catStats)

    } catch (err) {
      console.error('Failed to load report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-100'
    if (percentage >= 50) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  const getComplianceBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500'
    if (percentage >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading reports...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Reports</h1>
            <p className="text-text-secondary">Compliance analytics and document insights</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {(['overview', 'sites', 'categories'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{stats.totalDocuments}</p>
                    <p className="text-sm text-text-secondary">Total Documents</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{stats.complianceRate}%</p>
                    <p className="text-sm text-text-secondary">Compliance Rate</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{stats.expiringIn30Days}</p>
                    <p className="text-sm text-text-secondary">Expiring Soon</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{stats.expiredDocuments}</p>
                    <p className="text-sm text-text-secondary">Expired</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry Timeline */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Document Expiry Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-800">Next 30 Days</span>
                    <span className="text-2xl font-bold text-orange-900">{stats.expiringIn30Days}</span>
                  </div>
                  <div className="mt-2 h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full" 
                      style={{ width: `${Math.min((stats.expiringIn30Days / Math.max(stats.totalDocuments, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-800">Next 60 Days</span>
                    <span className="text-2xl font-bold text-amber-900">{stats.expiringIn60Days}</span>
                  </div>
                  <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.min((stats.expiringIn60Days / Math.max(stats.totalDocuments, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-800">Next 90 Days</span>
                    <span className="text-2xl font-bold text-yellow-900">{stats.expiringIn90Days}</span>
                  </div>
                  <div className="mt-2 h-2 bg-yellow-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full" 
                      style={{ width: `${Math.min((stats.expiringIn90Days / Math.max(stats.totalDocuments, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-text-secondary" />
                  <h3 className="text-lg font-semibold text-text-primary">Site Statistics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-secondary">Total Sites</span>
                    <span className="font-semibold text-text-primary">{stats.totalSites}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-secondary">Fully Compliant</span>
                    <span className="font-semibold text-emerald-600">
                      {stats.totalSites - stats.sitesWithMissingDocs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-text-secondary">Missing Required Docs</span>
                    <span className="font-semibold text-red-600">{stats.sitesWithMissingDocs}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-text-secondary" />
                  <h3 className="text-lg font-semibold text-text-primary">This Month</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-secondary">Documents Uploaded</span>
                    <span className="font-semibold text-text-primary">{stats.documentsUploadedThisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-secondary">Expired Documents</span>
                    <span className="font-semibold text-red-600">{stats.expiredDocuments}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-text-secondary">Compliance Rate</span>
                    <span className={`font-semibold ${stats.complianceRate >= 80 ? 'text-emerald-600' : stats.complianceRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {stats.complianceRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div className="card overflow-hidden">
            <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">
              Site Compliance Status
            </h3>
            {siteCompliance.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                No sites found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Organization</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Documents</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Missing</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Expired</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {siteCompliance.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-text-primary">{site.name}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{site.organization_name}</td>
                        <td className="px-6 py-4 text-center text-sm text-text-primary">{site.total_uploaded}</td>
                        <td className="px-6 py-4 text-center">
                          {site.missing_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {site.missing_count}
                            </span>
                          ) : (
                            <span className="text-emerald-600">✓</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {site.expired_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {site.expired_count}
                            </span>
                          ) : (
                            <span className="text-emerald-600">✓</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${getComplianceBarColor(site.compliance_percentage)}`}
                                style={{ width: `${site.compliance_percentage}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium px-2 py-0.5 rounded ${getComplianceColor(site.compliance_percentage)}`}>
                              {site.compliance_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="card overflow-hidden">
            <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">
              Document Categories
            </h3>
            {categoryStats.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                No categories found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Category</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Required</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Total Docs</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Expired</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase">Expiring (30d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categoryStats.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-text-primary">{cat.name}</td>
                        <td className="px-6 py-4 text-center">
                          {cat.is_required ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Required
                            </span>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-text-primary">{cat.total_count}</td>
                        <td className="px-6 py-4 text-center">
                          {cat.expired_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {cat.expired_count}
                            </span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {cat.expiring_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              {cat.expiring_count}
                            </span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
