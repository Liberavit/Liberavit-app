import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { Prospecto } from '@/types'

const TEMP_BADGE: Record<string, string> = {
  caliente: 'bg-red-50 text-red-700',
  tibio: 'bg-amber-50 text-amber-700',
  frio: 'bg-gray-100 text-gray-600',
}
const TEMP_LABEL: Record<string, string> = {
  caliente: '🔥 Caliente',
  tibio: '〰 Tibio',
  frio: '❄ Frío',
}

interface ProspectoConProyecto extends Prospecto {
  proyectos: { nombre: string } | null
}

interface PageProps {
  searchParams: Promise<{ ver?: string }>
}

export default async function ProspectosPage({ searchParams }: PageProps) {
  const { ver } = await searchParams
  const verArchivados = ver === 'archivados'
  const supabase = await createClient()

  const { data: prospectos } = await supabase
    .from('prospectos')
    .select('*, proyectos(nombre)')
    .eq('estatus', verArchivados ? 'archivado' : 'activo')
    .order('creado_en', { ascending: false })

  const lista = (prospectos ?? []) as ProspectoConProyecto[]
  const calientes = lista.filter(p => p.temperatura === 'caliente').length
  const tibios = lista.filter(p => p.temperatura === 'tibio').length
  const frios = lista.filter(p => p.temperatura === 'frio').length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            {verArchivados ? 'Prospectos archivados' : 'Prospectos compradores'}
          </h1>
          <Link
            href={verArchivados ? '/prospectos' : '/prospectos?ver=archivados'}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            {verArchivados ? '← Ver prospectos activos' : 'Ver archivados →'}
          </Link>
        </div>
        <Link href="/prospectos/nuevo">
          <button className="text-xs px-3.5 py-1.5 rounded-lg text-white" style={{ background: '#C0271A' }}>
            + Nuevo prospecto
          </button>
        </Link>
      </div>

      {/* Stats (solo en vista de activos) */}
      {!verArchivados && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total activos</p>
            <p className="text-2xl font-semibold" style={{ color: '#C0271A' }}>{lista.length}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-xs text-red-400 mb-1">🔥 Calientes</p>
            <p className="text-2xl font-semibold text-red-600">{calientes}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-400 mb-1">〰 Tibios</p>
            <p className="text-2xl font-semibold text-amber-600">{tibios}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">❄ Fríos</p>
            <p className="text-2xl font-semibold text-gray-600">{frios}</p>
          </div>
        </div>
      )}

      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-400">
          {verArchivados
            ? 'No hay prospectos archivados.'
            : 'No hay prospectos activos. Crea el primero con el botón "+ Nuevo prospecto".'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map(p => (
            <Link key={p.id} href={`/prospectos/${p.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition p-4 flex items-center gap-4 cursor-pointer">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ background: '#FCEBEB', color: '#C0271A' }}
                >
                  {p.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.proyectos?.nombre ?? 'Sin propiedad vinculada'}
                    {p.tipo_credito ? ` · ${p.tipo_credito}` : ''}
                    {p.estado_credito ? ` · ${p.estado_credito}` : ''}
                    {p.telefono ? ` · ${p.telefono}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.ultimo_contacto && (
                    <span className="text-[10px] text-gray-400">
                      Últ. contacto:{' '}
                      {new Date(p.ultimo_contacto).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  )}
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${TEMP_BADGE[p.temperatura]}`}
                  >
                    {TEMP_LABEL[p.temperatura]}
                  </span>
                  <span className="text-xs text-gray-300">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
