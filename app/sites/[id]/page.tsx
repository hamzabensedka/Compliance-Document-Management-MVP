'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UploadDocumentModal from '@/components/documents/UploadDocumentModal'
import Button from '@/components/ui/Button'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getDocumentDownloadUrl, deleteDocument } from '@/lib/utils/documents'
import { 
  Download, 
  Trash2, 
  Upload, 
  FileText, 
  AlertTriangle, 
  Filter,
  Search,
  User,
  Calendar,
  Clock
} from 'lucide-react'
import type { Site, Document, DocumentCategory, UserProfile } from '@/types/database'

type DocumentWithUploader = Omit<Document, 'uploader'> & {
  uploader?: { full_name: string; email: string } | null
}

export default function SiteDetailPage() {
  const params = useParams()
  const siteId = params.id as string
  const [site, setSite] = useState<Site | null>(null)
  const [documents, setDocuments] = useState<DocumentWithUploader[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | 'expiring' | 'valid'>('all')

  const supabase = createSupabaseClient()

  useEffect(() => {
    if (siteId) {
      loadSiteData()
    }
  }, [siteId])

  const loadSiteData = async () => {
    try {
      setLoading(true)
      const [siteData, docsData, catsData] = await Promise.all([
        supabase
          .from('sites')
          .select('*, organizations (*)')
          .eq('id', siteId)
          .single(),
        supabase
          .from('documents')
          .select('*, document_categories (*), uploader:user_profiles!uploaded_by (full_name, email)')
          .eq('site_id', siteId)
          .order('uploaded_at', { ascending: false }),
        supabase.from('document_categories').select('*').order('name'),
      ])

      if (siteData.data) setSite(siteData.data)
      if (docsData.data) setDocuments(docsData.data)
      if (catsData.data) setCategories(catsData.data)
    } catch (error) {
      console.error('Failed to load site data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const url = await getDocumentDownloadUrl(documentId)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      alert(`Failed to download: ${error.message}`)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await deleteDocument(documentId)
      loadSiteData()
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    }
  }

  const uploadedCategoryIds = new Set(documents.map((d) => d.category_id).filter(Boolean))
  const missingRequired = categories.filter(
    (cat) => cat.is_required && !uploadedCategoryIds.has(cat.id)
  )

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Category filter
    const matchesCategory = !categoryFilter || doc.category_id === categoryFilter

    // Expiry filter
    const today = new Date()
    const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    let matchesExpiry = true
    
    if (expiryFilter === 'expired') {
      matchesExpiry = doc.expiry_date ? new Date(doc.expiry_date) < today : false
    } else if (expiryFilter === 'expiring') {
      matchesExpiry = doc.expiry_date ? 
        new Date(doc.expiry_date) >= today && new Date(doc.expiry_date) <= thirtyDays : false
    } else if (expiryFilter === 'valid') {
      matchesExpiry = !doc.expiry_date || new Date(doc.expiry_date) > thirtyDays
    }

    return matchesSearch && matchesCategory && matchesExpiry
  })

  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { label: 'No expiry', class: 'bg-gray-100 text-gray-700' }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: 'Expired', class: 'bg-red-100 text-red-700' }
    } else if (diffDays <= 30) {
      return { label: `${diffDays} days`, class: 'bg-orange-100 text-orange-700' }
    } else if (diffDays <= 90) {
      return { label: `${diffDays} days`, class: 'bg-amber-100 text-amber-700' }
    }
    return { label: expiry.toLocaleDateString(), class: 'bg-emerald-100 text-emerald-700' }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading site data...
        </div>
      </DashboardLayout>
    )
  }

  if (!site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-text-secondary">Site not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">{site.name}</h1>
            {site.organization && (
              <p className="text-text-secondary">{site.organization.name}</p>
            )}
            {site.address && (
              <p className="text-sm text-text-secondary mt-1">{site.address}</p>
            )}
          </div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{documents.length}</p>
                <p className="text-sm text-blue-700">Total Documents</p>
              </div>
            </div>
          </div>
          <div className="card bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-900">
                  {categories.filter(c => c.is_required && uploadedCategoryIds.has(c.id)).length}
                </p>
                <p className="text-sm text-emerald-700">Required Uploaded</p>
              </div>
            </div>
          </div>
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">
                  {documents.filter(d => {
                    if (!d.expiry_date) return false
                    const diffDays = Math.ceil((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return diffDays >= 0 && diffDays <= 30
                  }).length}
                </p>
                <p className="text-sm text-orange-700">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-900">{missingRequired.length}</p>
                <p className="text-sm text-red-700">Missing Required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Required Documents Warning */}
        {missingRequired.length > 0 && (
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Required Documents Missing</h3>
                <div className="flex flex-wrap gap-2">
                  {missingRequired.map((cat) => (
                    <span 
                      key={cat.id} 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                <Filter className="w-4 h-4 inline mr-1" />
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.is_required && '(Required)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Expiry Status
              </label>
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="all">All Documents</option>
                <option value="expired">Expired</option>
                <option value="expiring">Expiring in 30 days</option>
                <option value="valid">Valid</option>
              </select>
            </div>
            <div className="flex items-end">
              {(searchQuery || categoryFilter || expiryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setCategoryFilter('')
                    setExpiryFilter('all')
                  }}
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Documents ({filteredDocuments.length})
            </h2>
          </div>
          
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-text-secondary mb-4 opacity-50" />
              <p className="text-text-secondary mb-4">
                {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
              </p>
              {documents.length === 0 && (
                <Button onClick={() => setUploadModalOpen(true)}>Upload First Document</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">File Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Uploaded By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Upload Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Expiry</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocuments.map((doc) => {
                    const expiryStatus = getExpiryStatus(doc.expiry_date)

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-text-secondary flex-shrink-0" />
                            <span className="text-sm font-medium text-text-primary truncate max-w-[200px]" title={doc.file_name}>
                              {doc.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {doc.category ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              doc.category.is_required 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {doc.category.name}
                            </span>
                          ) : (
                            <span className="text-sm text-text-secondary">Uncategorized</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {doc.uploader ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-sm text-text-primary">
                                {doc.uploader.full_name || doc.uploader.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">Unknown</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${expiryStatus.class}`}>
                            {expiryStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(doc.id, doc.file_name)}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadSiteData}
        sites={[site]}
      />
    </DashboardLayout>
  )
}
