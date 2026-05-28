import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function FinanzasPage() {
  const supabase = await createClient()

  const { data: proyectos } = await supabase.from('proyectos').select('id, nombre, zona').eq('estatus', 'activo')
  const { data: partidas } = await supabase.from('partidas_financieras').select('*')

  const lista = proyectos ?? []
  const allPartidas = partidas ?? []
  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

  let totalEgresosGlobal = 0
  let totalIngresosGlobal = 0

  return (
    <div>
      <h1 className="text-base font-semibold text-gray-900 mb-5">Finanzas — resumen general</h1>

      <div className="flex flex-col gap-4">
        {lista.map(p => {
          const pp = allPartidas.filter(x => x.proyecto_id === p.id && x.aplica)
          const egresos = pp.filter(x => x.tipo === 'egreso').reduce((a, x) => a + x.monto, 0)
          const ingresos = pp.filter(x => x.tipo === 'ingreso').reduce((a, x) => a + x.monto, 0)
          const utilidad = ingresos - egresos
          totalEgresosGlobal += egresos
          totalIngresosGlobal += ingresos

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Link href={`/proyectos/${p.id}?tab=finanzas`}>
                    <h2 className="text-sm font-semibold text-gray-900 hover:text-red-600 transition">{p.nombre}</h2>
                  </Link>
                  <p className="text-xs text-gray-400">{p.zona}</p>
                </div>
                <Link href={`/proyectos/${p.id}`}>
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Ver detalle →
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-gray-400 mb-1">Egresos</p>
                  <p className="text-sm font-semibold text-red-600">{fmt(egresos)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-gray-400 mb-1">Ingresos</p>
                  <p className="text-sm font-semibold text-green-600">{fmt(ingresos)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${utilidad >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-[11px] text-gray-400 mb-1">Utilidad est.</p>
                  <p className={`text-sm font-semibold ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(utilidad)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Totales globales */}
      {lista.length > 1 && (
        <div className="bg-white rounded-2xl border-2 p-5 mt-4" style={{ borderColor: '#C0271A' }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Consolidado — todos los proyectos</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Total egresos</p>
              <p className="text-lg font-bold text-red-600">{fmt(totalEgresosGlobal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Total ingresos</p>
              <p className="text-lg font-bold text-green-600">{fmt(totalIngresosGlobal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Utilidad total est.</p>
              <p className="text-lg font-bold" style={{ color: '#C0271A' }}>{fmt(totalIngresosGlobal - totalEgresosGlobal)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
