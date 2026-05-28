'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function Topbar({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'PL'

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="text-gray-900 font-medium">Programa Liberavit</span>
        <span>·</span>
        <span>Sistema de gestión</span>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/proyectos/nuevo">
          <button className="text-xs px-3.5 py-1.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: '#C0271A' }}>
            + Nuevo proyecto
          </button>
        </Link>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer"
             style={{ background: '#FCEBEB', color: '#C0271A' }}
             onClick={handleLogout}
             title="Cerrar sesión">
          {initials}
        </div>
      </div>
    </header>
  )
}
