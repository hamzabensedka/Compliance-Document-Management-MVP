'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UploadDocumentModal from '@/components/documents/UploadDocumentModal'
import Button from '@/components/ui/Button'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getDocumentDownloadUrl, deleteDocument } from '@/lib/utils/documents'
import { Download, Trash2, Upload, Search, Filter, FileText } from 'lucide-react'
import type { Document, Site, DocumentCategory } from '@/types/database'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [selectedSite, selectedCategory])

  const loadData = async () => {
    try {
      const [sitesData, categoriesData] = await Promise.all([
        supabase.from('sites').select('*').order('name'),
        supabase.from('document_categories').select('*').order('name'),
      ])

      if (sitesData.data) setSites(sitesData.data)
      if (categoriesData.data) setCategories(categoriesData.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('documents')
        .select(`
          *,
          sites (*),
          document_categories (*),
          user_profiles:uploaded_by (full_name, email)
        `)
        .order('uploaded_at', { ascending: false })

      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
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
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      await deleteDocument(documentId)
      loadDocuments()
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      doc.file_name.toLowerCase().includes(query) ||
      doc.site?.name.toLowerCase().includes(query) ||
      doc.category?.name.toLowerCase().includes(query)
    )
  })

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'No expiry', className: 'badge-info' }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: 'Expired', className: 'badge-danger' }
    } else if (diffDays <= 30) {
      return { label: `Expires in ${diffDays} days`, className: 'badge-warning' }
    } else {
      return { label: `Expires ${expiry.toLocaleDateString()}`, className: 'badge-success' }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Documents</h1>
            <p className="text-text-secondary">Manage your compliance documents</p>
          </div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2 inline" />
            Upload Document
          </Button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                <Filter className="w-4 h-4 inline mr-1" />
                Site
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="input-field"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-text-secondary mb-4" />
              <p className="text-text-secondary mb-2">No documents found</p>
              <Button onClick={() => setUploadModalOpen(true)}>Upload Your First Document</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">File Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Site</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Uploaded</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocuments.map((doc) => {
                    const expiryStatus = getExpiryStatus(doc.expiry_date || undefined)
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-text-secondary" />
                            <span className="text-sm text-text-primary">{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {doc.site?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {doc.category?.name || 'Uncategorized'}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${expiryStatus.className}`}>
                            {expiryStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(doc.id, doc.file_name)}
                              className="text-primary hover:text-primary-dark transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="text-danger hover:text-red-700 transition-colors"
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
        onSuccess={loadDocuments}
        sites={sites}
      />
    </DashboardLayout>
  )
}

