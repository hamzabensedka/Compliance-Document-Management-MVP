'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Compliance Document Portal</h2>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </header>
  )
}

