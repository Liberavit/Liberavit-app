import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ETAPAS } from '@/types'

export default async function DocumentosPage() {
  const supabase = await createClient()

  const { data: proyectos } = await supabase.from('proyectos').select('id, nombre, zona, etapa_actual').eq('estatus', 'activo')
  const { data: docs } = await supabase.from('documentos').select('*')

  const lista = proyectos ?? []
  const allDocs = docs ?? []

  return (
    <div>
      <h1 className="text-base font-semibold text-gray-900 mb-5">Documentos — todos los proyectos</h1>

      {lista.map(p => {
        const pdocs = allDocs.filter(d => d.proyecto_id === p.id)
        const listos = pdocs.filter(d => d.estado === 'listo').length
        const faltOblig = pdocs.filter(d => d.estado === 'faltante' && d.requerido === 'obligatorio').length
        const pct = pdocs.length > 0 ? Math.round((listos / pdocs.length) * 100) : 0

        return (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Link href={`/proyectos/${p.id}?tab=documentos`}>
                  <h2 className="text-sm font-semibold text-gray-900 hover:text-red-600 transition">{p.nombre}</h2>
                </Link>
                <p className="text-xs text-gray-400">{p.zona} · Etapa {p.etapa_actual}: {ETAPAS[p.etapa_actual - 1]?.nombre}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color: '#C0271A' }}>{pct}%</div>
                <div className="text-[10px] text-gray-400">{listos}/{pdocs.length} listos</div>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mb-2">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: '#C0271A' }} />
            </div>
            {faltOblig > 0 && (
              <p className="text-[11px] text-red-600">⚠ {faltOblig} documento{faltOblig > 1 ? 's' : ''} obligatorio{faltOblig > 1 ? 's' : ''} faltante{faltOblig > 1 ? 's' : ''}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
