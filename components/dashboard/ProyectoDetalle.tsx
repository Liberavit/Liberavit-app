'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { ETAPAS, ETAPA_COLORES, TEMPERATURA_OPTIONS, type Proyecto, type Documento, type PartidaFinanciera, type Prospecto, type TemperaturaProspecto, type EstadoDocumento } from '@/types'

type Tab = 'etapas' | 'documentos' | 'finanzas' | 'prospectos'

const TEMP_BADGE: Record<string, string> = {
  caliente: 'bg-red-50 text-red-700',
  tibio:    'bg-amber-50 text-amber-700',
  frio:     'bg-gray-100 text-gray-600',
}
const TEMP_LABEL: Record<string, string> = {
  caliente: '🔥 Caliente',
  tibio:    '〰 Tibio',
  frio:     '❄ Frío',
}

interface NuevoProspectoState {
  nombre: string
  telefono: string
  tipo_credito: string
  temperatura: TemperaturaProspecto
}

export default function ProyectoDetalle({
  proyecto,
  documentos,
  partidas,
  prospectos: prospectosInit,
}: {
  proyecto: Proyecto
  documentos: Documento[]
  partidas: PartidaFinanciera[]
  prospectos: Prospecto[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('etapas')
  const [docs, setDocs] = useState(documentos)
  const [parts, setParts] = useState(partidas)
  const [prospectos, setProspectos] = useState(prospectosInit)
  const [openEtapas, setOpenEtapas] = useState<Set<number>>(new Set([proyecto.etapa_actual]))
  const [savingDoc, setSavingDoc] = useState<string | null>(null)
  const [showAddProspecto, setShowAddProspecto] = useState(false)
  const [nuevoProspecto, setNuevoProspecto] = useState<NuevoProspectoState>({
    nombre: '',
    telefono: '',
    tipo_credito: 'Infonavit',
    temperatura: 'frio',
  })

  // ── Etapas ──────────────────────────────────────────
  const progreso = Math.round(((proyecto.etapa_actual - 1) / 6) * 100)

  async function avanzarEtapa() {
    if (proyecto.etapa_actual >= 7) return
    const faltantesOblig = docs.filter(
      d =>
        d.etapa === proyecto.etapa_actual &&
        d.estado === 'faltante' &&
        d.requerido === 'obligatorio'
    )
    if (faltantesOblig.length > 0) {
      alert(
        `No puedes avanzar: hay ${faltantesOblig.length} documento(s) obligatorio(s) faltantes en esta etapa.`
      )
      return
    }
    const nuevaEtapa = proyecto.etapa_actual + 1
    await supabase
      .from('proyectos')
      .update({ etapa_actual: nuevaEtapa })
      .eq('id', proyecto.id)
    router.refresh()
  }

  // ── Documentos ──────────────────────────────────────
  function toggleEtapaDoc(num: number) {
    setOpenEtapas(prev => {
      const s = new Set(prev)
      s.has(num) ? s.delete(num) : s.add(num)
      return s
    })
  }

  async function cambiarEstadoDoc(docId: string, nuevoEstado: EstadoDocumento) {
    setSavingDoc(docId)
    await supabase.from('documentos').update({ estado: nuevoEstado }).eq('id', docId)
    setDocs(prev => prev.map(d => (d.id === docId ? { ...d, estado: nuevoEstado } : d)))
    setSavingDoc(null)
  }

  const docsPorEtapa = (etapa: number) => docs.filter(d => d.etapa === etapa)
  const docsListos = docs.filter(d => d.estado === 'listo').length
  const pctDocs = docs.length > 0 ? Math.round((docsListos / docs.length) * 100) : 0
  const faltantesObligActual = docs.filter(
    d =>
      d.etapa === proyecto.etapa_actual &&
      d.estado === 'faltante' &&
      d.requerido === 'obligatorio'
  ).length

  // ── Finanzas ─────────────────────────────────────────
  const egresos = parts.filter(p => p.tipo === 'egreso' && p.aplica)
  const ingresos = parts.filter(p => p.tipo === 'ingreso' && p.aplica)
  const totalEgresos = egresos.reduce((a, p) => a + p.monto, 0)
  const totalIngresos = ingresos.reduce((a, p) => a + p.monto, 0)
  const utilidad = totalIngresos - totalEgresos

  async function actualizarMonto(id: string, monto: number) {
    await supabase.from('partidas_financieras').update({ monto }).eq('id', id)
    setParts(prev => prev.map(p => (p.id === id ? { ...p, monto } : p)))
  }

  async function toggleAplica(id: string, aplica: boolean) {
    await supabase.from('partidas_financieras').update({ aplica }).eq('id', id)
    setParts(prev => prev.map(p => (p.id === id ? { ...p, aplica } : p)))
  }

  // ── Prospectos ───────────────────────────────────────
  async function agregarProspecto() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('prospectos')
      .insert({
        proyecto_id: proyecto.id,
        nombre: nuevoProspecto.nombre,
        telefono: nuevoProspecto.telefono || null,
        tipo_credito: nuevoProspecto.tipo_credito,
        temperatura: nuevoProspecto.temperatura,
        estatus: 'activo',
        asignado_a: user?.id,
      })
      .select()
      .single()
    if (data) {
      setProspectos(prev => [data, ...prev])
      setShowAddProspecto(false)
      setNuevoProspecto({ nombre: '', telefono: '', tipo_credito: 'Infonavit', temperatura: 'frio' })
    }
  }

  async function cambiarTemperatura(id: string, temperatura: string) {
    const temp = temperatura as TemperaturaProspecto
    await supabase.from('prospectos').update({ temperatura: temp }).eq('id', id)
    setProspectos(prev => prev.map(p => (p.id === id ? { ...p, temperatura: temp } : p)))
  }

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

  return (
    <div>
      {/* Header del proyecto */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{proyecto.nombre}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {proyecto.zona}
              {proyecto.metros2 ? ` · ${proyecto.metros2}m²` : ''} · {proyecto.recamaras} rec /{' '}
              {proyecto.banos} baño
              {proyecto.fecha_inicio &&
                ` · Inicio: ${new Date(proyecto.fecha_inicio).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-semibold" style={{ color: '#C0271A' }}>
                Etapa {proyecto.etapa_actual}/7
              </div>
              <div className="text-xs text-gray-400">{ETAPAS[proyecto.etapa_actual - 1]?.nombre}</div>
            </div>
            {proyecto.etapa_actual < 7 && (
              <button
                onClick={avanzarEtapa}
                className="text-xs px-3.5 py-2 rounded-lg text-white transition hover:opacity-90"
                style={{ background: '#C0271A' }}
              >
                Avanzar etapa →
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>Progreso general</span>
            <span>{progreso}%</span>
          </div>
          <div className="flex gap-1">
            {ETAPAS.map(e => (
              <div
                key={e.num}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background:
                    e.num < proyecto.etapa_actual
                      ? '#C0271A'
                      : e.num === proyecto.etapa_actual
                      ? '#EF9F27'
                      : '#e5e7eb',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {(
          [
            ['etapas', `Etapas`],
            ['documentos', `Documentos (${docsListos}/${docs.length})`],
            ['finanzas', 'Finanzas'],
            ['prospectos', `Prospectos (${prospectos.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-xs px-4 py-2 rounded-lg border transition ${
              tab === key
                ? 'text-white border-transparent'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
            style={tab === key ? { background: '#C0271A', borderColor: '#C0271A' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Etapas ── */}
      {tab === 'etapas' && (
        <div className="flex flex-col gap-2">
          {ETAPAS.map(e => {
            const estado = e.num < proyecto.etapa_actual ? 'done' : e.num === proyecto.etapa_actual ? 'actual' : 'pendiente'
            return (
              <div
                key={e.num}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                  estado === 'actual' ? 'border-amber-200' : 'border-gray-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    estado === 'done'
                      ? 'bg-green-100 text-green-700'
                      : estado === 'actual'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {estado === 'done' ? '✓' : e.num}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{e.nombre}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {estado === 'done' ? 'Completado' : estado === 'actual' ? 'En curso' : 'Pendiente'}
                  </div>
                </div>
                {estado === 'actual' && faltantesObligActual > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full">
                    {faltantesObligActual} docs obligatorios faltantes
                  </span>
                )}
                {estado === 'done' && (
                  <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full">
                    Completo
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: Documentos ── */}
      {tab === 'documentos' && (
        <div>
          {/* Progreso docs */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Expediente completo</span>
                <span className="font-medium" style={{ color: '#C0271A' }}>
                  {pctDocs}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pctDocs}%`, background: '#C0271A' }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {docsListos} de {docs.length} listos
            </div>
          </div>

          {faltantesObligActual > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center gap-2">
              <span className="text-amber-500">⚠</span>
              <p className="text-xs text-amber-700">
                Avance bloqueado: {faltantesObligActual} documento
                {faltantesObligActual > 1 ? 's' : ''} obligatorio
                {faltantesObligActual > 1 ? 's' : ''} faltante
                {faltantesObligActual > 1 ? 's' : ''} en la etapa actual.
              </p>
            </div>
          )}

          {ETAPAS.map(e => {
            const docsEtapa = docsPorEtapa(e.num)
            if (docsEtapa.length === 0) return null
            const isOpen = openEtapas.has(e.num)
            const faltOblig = docsEtapa.filter(d => d.estado === 'faltante' && d.requerido === 'obligatorio').length
            const todos = docsEtapa.every(d => d.estado === 'listo')
            const etapaEstado =
              e.num < proyecto.etapa_actual ? 'done' : e.num === proyecto.etapa_actual ? 'actual' : 'pendiente'

            return (
              <div key={e.num} className="bg-white rounded-xl border border-gray-200 mb-2 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                  onClick={() => toggleEtapaDoc(e.num)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                        etapaEstado === 'done'
                          ? 'bg-green-100 text-green-700'
                          : etapaEstado === 'actual'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {etapaEstado === 'done' ? '✓' : e.num}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{e.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {todos ? (
                      <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                        Completo
                      </span>
                    ) : faltOblig > 0 ? (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                        {faltOblig} obligatorio{faltOblig > 1 ? 's' : ''} faltante
                        {faltOblig > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                        Opcional pendiente
                      </span>
                    )}
                    <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {docsEtapa.map(d => (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 cursor-pointer border transition ${
                            d.estado === 'listo' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}
                          onClick={() =>
                            cambiarEstadoDoc(d.id, d.estado === 'listo' ? 'faltante' : 'listo')
                          }
                        >
                          {d.estado === 'listo' && <span className="text-white text-[9px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-800">{d.nombre}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400">
                              {d.tipo === 'archivo' ? '📄 Archivo' : '☑ Checklist'}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded ${
                                d.requerido === 'obligatorio'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {d.requerido}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={d.estado}
                            disabled={savingDoc === d.id}
                            onChange={ev => cambiarEstadoDoc(d.id, ev.target.value as EstadoDocumento)}
                            className="text-[10px] border border-gray-200 rounded-lg px-1.5 py-1 bg-white focus:outline-none cursor-pointer"
                          >
                            <option value="faltante">Faltante</option>
                            <option value="tramite">En trámite</option>
                            <option value="listo">Listo</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: Finanzas ── */}
      {tab === 'finanzas' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Egresos */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Egresos</h3>
            <div className="flex flex-col gap-2">
              {parts
                .filter(p => p.tipo === 'egreso')
                .map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.aplica}
                      onChange={e => toggleAplica(p.id, e.target.checked)}
                      className="accent-red-600 w-3 h-3 flex-shrink-0"
                    />
                    <span
                      className={`text-xs flex-1 ${!p.aplica ? 'text-gray-300 line-through' : 'text-gray-600'}`}
                    >
                      {p.concepto}
                    </span>
                    <input
                      type="number"
                      value={p.monto || ''}
                      onChange={e => actualizarMonto(p.id, parseFloat(e.target.value) || 0)}
                      disabled={!p.aplica}
                      placeholder="0"
                      className="w-24 text-xs text-right border border-gray-200 rounded px-1.5 py-1 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300"
                    />
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Total egresos</span>
              <span className="text-red-600">{fmt(totalEgresos)}</span>
            </div>
          </div>

          {/* Ingresos + Utilidad */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ingresos / Capital</h3>
              <div className="flex flex-col gap-2">
                {parts
                  .filter(p => p.tipo === 'ingreso')
                  .map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={p.aplica}
                        onChange={e => toggleAplica(p.id, e.target.checked)}
                        className="accent-red-600 w-3 h-3 flex-shrink-0"
                      />
                      <span
                        className={`text-xs flex-1 ${!p.aplica ? 'text-gray-300 line-through' : 'text-gray-600'}`}
                      >
                        {p.concepto}
                      </span>
                      <input
                        type="number"
                        value={p.monto || ''}
                        onChange={e => actualizarMonto(p.id, parseFloat(e.target.value) || 0)}
                        disabled={!p.aplica}
                        placeholder="0"
                        className="w-24 text-xs text-right border border-gray-200 rounded px-1.5 py-1 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300"
                      />
                    </div>
                  ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm font-semibold">
                <span className="text-gray-700">Total ingresos</span>
                <span className="text-green-600">{fmt(totalIngresos)}</span>
              </div>
            </div>

            <div
              className="bg-white rounded-xl border-2 p-4 flex items-center justify-between"
              style={{ borderColor: utilidad >= 0 ? '#16a34a' : '#dc2626' }}
            >
              <div>
                <p className="text-xs text-gray-500">Utilidad estimada</p>
                <p
                  className={`text-2xl font-bold mt-0.5 ${
                    utilidad >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {fmt(utilidad)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Margen</p>
                <p className="text-sm font-semibold text-gray-700">
                  {totalIngresos > 0 ? `${Math.round((utilidad / totalIngresos) * 100)}%` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Prospectos ── */}
      {tab === 'prospectos' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500">
              {prospectos.length} prospecto
              {prospectos.length !== 1 ? 's' : ''} registrado
              {prospectos.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowAddProspecto(true)}
              className="text-xs px-3.5 py-1.5 rounded-lg text-white"
              style={{ background: '#C0271A' }}
            >
              + Agregar prospecto
            </button>
          </div>

          {showAddProspecto && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Nuevo prospecto</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  value={nuevoProspecto.nombre}
                  onChange={e => setNuevoProspecto(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre completo *"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
                />
                <input
                  value={nuevoProspecto.telefono}
                  onChange={e => setNuevoProspecto(p => ({ ...p, telefono: e.target.value }))}
                  placeholder="Teléfono"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
                />
                <select
                  value={nuevoProspecto.tipo_credito}
                  onChange={e => setNuevoProspecto(p => ({ ...p, tipo_credito: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  <option>Infonavit</option>
                  <option>Bancario</option>
                  <option>Propio</option>
                </select>
                <select
                  value={nuevoProspecto.temperatura}
                  onChange={e =>
                    setNuevoProspecto(p => ({
                      ...p,
                      temperatura: e.target.value as TemperaturaProspecto,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  {TEMPERATURA_OPTIONS.map(temp => (
                    <option key={temp} value={temp}>
                      {TEMP_LABEL[temp]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddProspecto(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarProspecto}
                  disabled={!nuevoProspecto.nombre}
                  className="flex-1 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                  style={{ background: '#C0271A' }}
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {prospectos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              Sin prospectos aún. Agrega el primero cuando empiece la comercialización.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {prospectos.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: '#FCEBEB', color: '#C0271A' }}
                  >
                    {p.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.tipo_credito}
                      {p.estado_credito ? ` · ${p.estado_credito}` : ''}
                      {p.telefono ? ` · ${p.telefono}` : ''}
                    </div>
                  </div>
                  <select
                    value={p.temperatura}
                    onChange={e => cambiarTemperatura(p.id, e.target.value)}
                    className={`text-[11px] px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none ${
                      TEMP_BADGE[p.temperatura]
                    }`}
                  >
                    {TEMPERATURA_OPTIONS.map(temp => (
                      <option key={temp} value={temp}>
                        {TEMP_LABEL[temp]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
