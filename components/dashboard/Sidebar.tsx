'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ETAPAS = [
  { num: 1, nombre: 'Captación',        color: '#1D9E75' },
  { num: 2, nombre: 'Negociación / DD', color: '#993556' },
  { num: 3, nombre: 'Firma contrato',   color: '#EF9F27' },
  { num: 4, nombre: 'Remodelación',     color: '#378ADD' },
  { num: 5, nombre: 'Comercialización', color: '#3B6D11' },
  { num: 6, nombre: 'Tramitología',     color: '#534AB7' },
  { num: 7, nombre: 'Cierre',           color: '#5F5E5A' },
]

const NAV = [
  { href: '/proyectos',  label: 'Proyectos',  icon: '▦' },
  { href: '/prospectos', label: 'Prospectos', icon: '◎' },
  { href: '/finanzas',   label: 'Finanzas',   icon: '▲' },
  { href: '/documentos', label: 'Documentos', icon: '▤' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-52 bg-[#1a1a1a] flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
               style={{ background: '#C0271A' }}>
            PL
          </div>
          <div>
            <div className="text-white text-sm font-medium">Liberavit</div>
            <div className="text-white/30 text-[10px]">Panel de control</div>
          </div>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="px-2.5 pt-3">
        <p className="text-white/30 text-[10px] uppercase tracking-widest px-2 mb-1.5">Principal</p>
        {NAV.map(item => {
          const active = path.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-0.5 transition-colors ${
                active
                  ? 'text-white font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              style={active ? { background: '#C0271A' } : {}}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Etapas */}
      <div className="px-2.5 pt-4">
        <p className="text-white/30 text-[10px] uppercase tracking-widest px-2 mb-1.5">Etapas</p>
        {ETAPAS.map(e => (
          <Link key={e.num} href={`/proyectos?etapa=${e.num}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors mb-0.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
            {e.nombre}
          </Link>
        ))}
      </div>

      <div className="mt-auto px-2.5 pb-4 pt-3 border-t border-white/10">
        <Link href="/configuracion"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          ⚙ Configuración
        </Link>
      </div>
    </aside>
  )
}
