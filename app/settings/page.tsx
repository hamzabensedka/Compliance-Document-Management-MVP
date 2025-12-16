'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your account settings</p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">Settings feature coming soon</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

