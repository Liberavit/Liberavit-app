import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ETAPAS, ETAPA_COLORES, type Proyecto, type Documento } from '@/types'

const ETAPA_BADGE: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-800',
  2: 'bg-pink-50 text-pink-800',
  3: 'bg-amber-50 text-amber-800',
  4: 'bg-blue-50 text-blue-800',
  5: 'bg-green-50 text-green-800',
  6: 'bg-indigo-50 text-indigo-800',
  7: 'bg-gray-100 text-gray-700',
}

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: { etapa?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('proyectos')
    .select('*')
    .eq('estatus', 'activo')
    .order('creado_en', { ascending: false })

  if (searchParams.etapa) {
    query = query.eq('etapa_actual', parseInt(searchParams.etapa))
  }

  const { data: proyectos } = await query as { data: Proyecto[] | null }

  // Documentos faltantes por proyecto
  const { data: docsFaltantes } = await supabase
    .from('documentos')
    .select('proyecto_id')
    .eq('estado', 'faltante')
    .eq('requerido', 'obligatorio')

  const faltantesPorProyecto = (docsFaltantes ?? []).reduce((acc, d) => {
    acc[d.proyecto_id] = (acc[d.proyecto_id] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const lista = proyectos ?? []
  const totalDocs = Object.values(faltantesPorProyecto).reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Proyectos activos', value: lista.length, sub: 'en curso', accent: true },
          { label: 'Docs obligatorios faltantes', value: totalDocs, sub: 'pendientes', warn: totalDocs > 0 },
          { label: 'En remodelación', value: lista.filter(p => p.etapa_actual === 4).length, sub: 'propiedades' },
          { label: 'En comercialización', value: lista.filter(p => p.etapa_actual === 5).length, sub: 'en venta' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.accent ? 'text-[#C0271A]' : s.warn ? 'text-amber-600' : 'text-gray-900'}`}>
              {s.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {searchParams.etapa
            ? `Etapa ${searchParams.etapa}: ${ETAPAS.find(e => e.num === parseInt(searchParams.etapa!))?.nombre}`
            : 'Todos los proyectos'}
        </h2>
        <Link href="/proyectos/nuevo">
          <button className="text-xs px-3.5 py-1.5 rounded-lg text-white" style={{ background: '#C0271A' }}>
            + Nuevo proyecto
          </button>
        </Link>
      </div>

      {/* Grid */}
      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No hay proyectos activos.</p>
          <Link href="/proyectos/nuevo">
            <button className="mt-4 text-xs px-4 py-2 rounded-lg text-white" style={{ background: '#C0271A' }}>
              Crear primer proyecto
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {lista.map(p => {
            const etapa = ETAPAS.find(e => e.num === p.etapa_actual)
            const faltantes = faltantesPorProyecto[p.id] ?? 0
            const progreso = Math.round(((p.etapa_actual - 1) / 6) * 100)

            return (
              <Link key={p.id} href={`/proyectos/${p.id}`}>
                <div className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 cursor-pointer transition overflow-hidden">
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{p.nombre}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.zona} · {p.metros2 ? `${p.metros2}m²` : ''} · {p.recamaras} rec / {p.banos} baño
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${ETAPA_BADGE[p.etapa_actual]}`}>
                        {etapa?.nombre}
                      </span>
                    </div>
                  </div>

                  {/* Dots etapas */}
                  <div className="flex gap-1 px-4 pb-2">
                    {ETAPAS.map(e => (
                      <div key={e.num} className="flex-1 h-1 rounded-full"
                           style={{
                             background: e.num < p.etapa_actual
                               ? ETAPA_COLORES[p.etapa_actual]
                               : e.num === p.etapa_actual
                               ? '#EF9F27'
                               : '#e5e7eb'
                           }} />
                    ))}
                  </div>

                  {/* Progreso */}
                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Avance</span>
                      <span>{progreso}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                      <div className="h-1 rounded-full transition-all" style={{ width: `${progreso}%`, background: '#C0271A' }} />
                    </div>
                  </div>

                  <div className="px-4 py-2.5 border-t border-gray-100 flex justify-between">
                    <span className="text-[10px] text-gray-400">
                      📅 {p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                    </span>
                    {faltantes > 0 ? (
                      <span className="text-[10px] text-red-600">⚠ {faltantes} docs faltantes</span>
                    ) : (
                      <span className="text-[10px] text-green-600">✓ Docs al día</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
