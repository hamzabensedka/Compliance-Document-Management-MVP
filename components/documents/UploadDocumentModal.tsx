'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Upload, X } from 'lucide-react'
import { uploadDocument } from '@/lib/utils/documents'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Site, DocumentCategory } from '@/types/database'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sites: Site[]
}

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  sites,
}: UploadDocumentModalProps) {
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<DocumentCategory[]>([])

  // Load categories when modal opens
  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createSupabaseClient()
      const { data } = await supabase
        .from('document_categories')
        .select('*')
        .order('name')
      if (data) setCategories(data as DocumentCategory[])
    }
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Please select a file')
      return
    }

    if (!selectedSite) {
      setError('Please select a site')
      return
    }

    setLoading(true)

    try {
      await uploadDocument({
        file,
        siteId: selectedSite,
        categoryId: selectedCategory || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes || undefined,
      })

      // Reset form
      setSelectedSite('')
      setSelectedCategory('')
      setExpiryDate('')
      setNotes('')
      setFile(null)
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Site *
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select a site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Document Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {cat.is_required && '(Required)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            File *
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-md p-8 text-center hover:bg-gray-50 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-danger hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto text-text-secondary mb-2" />
                <p className="text-sm text-text-secondary mb-1">
                  Drag & drop file here or click to browse
                </p>
                <p className="text-xs text-text-secondary">
                  Accepted: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                </p>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-2 inline-block btn-secondary cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Add any additional notes..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

