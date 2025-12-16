'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import { FileText, AlertTriangle, Upload, Building2 } from 'lucide-react'
import { getDashboardStats, getExpiringDocuments, getMissingDocuments } from '@/lib/utils/analytics'
import type { ExpiringDocument, MissingDocument } from '@/lib/utils/analytics'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    expiringSoon: 0,
    uploadedToday: 0,
    totalSites: 0,
  })
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([])
  const [missingDocs, setMissingDocs] = useState<MissingDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<30 | 60 | 90>(30)

  useEffect(() => {
    loadDashboardData()
  }, [activeTab])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, expiring30, missing] = await Promise.all([
        getDashboardStats(),
        getExpiringDocuments(activeTab),
        getMissingDocuments(),
      ])

      setStats(statsData)
      setExpiringDocs(expiring30)
      setMissingDocs(missing)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Overview of your compliance documents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Documents"
            value={stats.totalDocuments.toLocaleString()}
            icon={<FileText className="w-8 h-8" />}
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiringSoon.toLocaleString()}
            icon={<AlertTriangle className="w-8 h-8" />}
          />
          <StatCard
            title="Uploaded Today"
            value={stats.uploadedToday.toLocaleString()}
            icon={<Upload className="w-8 h-8" />}
          />
          <StatCard
            title="Total Sites"
            value={stats.totalSites.toLocaleString()}
            icon={<Building2 className="w-8 h-8" />}
          />
        </div>

        {/* Expiring Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Expiring Documents</h2>
            <div className="flex gap-2">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setActiveTab(days as 30 | 60 | 90)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeTab === days
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : expiringDocs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No documents expiring in the next {activeTab} days
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Site Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expiringDocs.map((doc) => {
                    const daysLeft = getDaysUntilExpiry(doc.expiry_date!)
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {doc.site?.name || 'Unknown Site'}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {doc.category?.name || doc.file_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={daysLeft <= 7 ? 'text-danger font-medium' : daysLeft <= 30 ? 'text-warning' : 'text-text-secondary'}>
                            {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="text-primary hover:text-primary-dark"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Missing Required Documents */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Missing Required Documents</h2>
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : missingDocs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              All required documents are up to date
            </div>
          ) : (
            <div className="space-y-4">
              {missingDocs.map((item) => (
                <div key={item.site_id} className="border border-warning bg-orange-50 rounded-md p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">{item.site_name}</h3>
                      {item.organization_name && (
                        <p className="text-sm text-text-secondary">{item.organization_name}</p>
                      )}
                      <ul className="mt-2 space-y-1">
                        {item.missing_documents.map((doc) => (
                          <li key={doc.id} className="text-sm text-text-secondary flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            {doc.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/sites/${item.site_id}`}
                      className="btn-primary text-sm"
                    >
                      View Site
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

