'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  TEMPERATURA_OPTIONS,
  type Prospecto,
  type SeguimientoProspecto,
  type TemperaturaProspecto,
} from '@/types'

type TipoContacto = 'llamada' | 'whatsapp' | 'visita'

const TEMP_LABEL: Record<string, string> = {
  caliente: '🔥 Caliente',
  tibio: '〰 Tibio',
  frio: '❄ Frío',
}

const TIPO_ICON: Record<string, string> = {
  llamada: '📞',
  whatsapp: '💬',
  visita: '🏠',
  nota: '📝',
}

const TIPO_LABEL: Record<string, string> = {
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  visita: 'Visita',
  nota: 'Comentario',
}

interface ProyectoOpcion {
  id: string
  nombre: string
}

interface FormState {
  nombre: string
  telefono: string
  email: string
  tipo_credito: string
  estado_credito: string
  temperatura: TemperaturaProspecto
  proyecto_id: string
  notas: string
}

export default function ProspectoDetalle({
  prospecto,
  seguimientos: seguimientosInit,
  proyectos,
}: {
  prospecto: Prospecto
  seguimientos: SeguimientoProspecto[]
  proyectos: ProyectoOpcion[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<FormState>({
    nombre: prospecto.nombre,
    telefono: prospecto.telefono ?? '',
    email: prospecto.email ?? '',
    tipo_credito: prospecto.tipo_credito ?? 'Infonavit',
    estado_credito: prospecto.estado_credito ?? '',
    temperatura: prospecto.temperatura,
    proyecto_id: prospecto.proyecto_id ?? '',
    notas: prospecto.notas ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [seguimientos, setSeguimientos] = useState(seguimientosInit)
  const [nuevoContacto, setNuevoContacto] = useState<{ tipo: TipoContacto; descripcion: string }>({
    tipo: 'llamada',
    descripcion: '',
  })
  const [nuevoComentario, setNuevoComentario] = useState('')

  const contactos = seguimientos.filter(s => s.tipo !== 'nota')
  const comentarios = seguimientos.filter(s => s.tipo === 'nota')
  const archivado = prospecto.estatus === 'archivado'

  function set(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setMensaje('')
  }

  function fmtFecha(fecha: string) {
    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ── Guardar cambios de datos ─────────────────────────
  async function guardarCambios() {
    setGuardando(true)
    const { error } = await supabase
      .from('prospectos')
      .update({
        nombre: form.nombre,
        telefono: form.telefono || null,
        email: form.email || null,
        tipo_credito: form.tipo_credito || null,
        estado_credito: form.estado_credito || null,
        temperatura: form.temperatura,
        proyecto_id: form.proyecto_id || null,
        notas: form.notas || null,
      })
      .eq('id', prospecto.id)
    setGuardando(false)
    if (error) {
      setMensaje('Error al guardar. Intenta de nuevo.')
    } else {
      setMensaje('Cambios guardados correctamente ✓')
      router.refresh()
    }
  }

  // ── Registro de contactos ────────────────────────────
  async function registrarContacto() {
    if (!nuevoContacto.descripcion.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('seguimiento_prospectos')
      .insert({
        prospecto_id: prospecto.id,
        tipo: nuevoContacto.tipo,
        descripcion: nuevoContacto.descripcion.trim(),
        registrado_por: user?.id ?? null,
      })
      .select()
      .single()
    if (data) {
      setSeguimientos(prev => [data, ...prev])
      const hoy = new Date().toISOString().split('T')[0]
      await supabase.from('prospectos').update({ ultimo_contacto: hoy }).eq('id', prospecto.id)
      setNuevoContacto({ tipo: 'llamada', descripcion: '' })
    }
  }

  // ── Comentarios ──────────────────────────────────────
  async function agregarComentario() {
    if (!nuevoComentario.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('seguimiento_prospectos')
      .insert({
        prospecto_id: prospecto.id,
        tipo: 'nota',
        descripcion: nuevoComentario.trim(),
        registrado_por: user?.id ?? null,
      })
      .select()
      .single()
    if (data) {
      setSeguimientos(prev => [data, ...prev])
      setNuevoComentario('')
    }
  }

  // ── Archivar / Restaurar / Eliminar ──────────────────
  async function toggleArchivar() {
    const nuevoEstatus = archivado ? 'activo' : 'archivado'
    const pregunta = archivado
      ? '¿Restaurar este prospecto? Volverá a aparecer en la lista de prospectos activos.'
      : '¿Archivar este prospecto? Dejará de aparecer en la lista de prospectos activos, pero podrás consultarlo en archivados.'
    if (!window.confirm(pregunta)) return
    await supabase.from('prospectos').update({ estatus: nuevoEstatus }).eq('id', prospecto.id)
    router.push('/prospectos')
    router.refresh()
  }

  async function eliminarProspecto() {
    if (
      !window.confirm(
        '¿Eliminar este prospecto PERMANENTEMENTE? Se borrará también todo su historial de contactos y comentarios. Esta acción no se puede deshacer.'
      )
    )
      return
    await supabase.from('prospectos').delete().eq('id', prospecto.id)
    router.push('/prospectos')
    router.refresh()
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Volver */}
      <Link href="/prospectos" className="text-xs text-gray-400 hover:text-gray-600 transition">
        ← Volver a prospectos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-3 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{ background: '#FCEBEB', color: '#C0271A' }}
            >
              {form.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">{form.nombre}</h1>
                {archivado && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    Archivado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {contactos.length} contacto{contactos.length !== 1 ? 's' : ''} registrado
                {contactos.length !== 1 ? 's' : ''}
                {prospecto.ultimo_contacto &&
                  ` · Último contacto: ${new Date(prospecto.ultimo_contacto).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={toggleArchivar}
              className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              {archivado ? '↩ Restaurar' : '🗂 Archivar'}
            </button>
            <button
              onClick={eliminarProspecto}
              className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              🗑 Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* ── Columna izquierda: Datos ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-fit">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Datos del prospecto</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de crédito</label>
                <select
                  value={form.tipo_credito}
                  onChange={e => set('tipo_credito', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  <option>Infonavit</option>
                  <option>Bancario</option>
                  <option>Propio</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado del crédito</label>
                <select
                  value={form.estado_credito}
                  onChange={e => set('estado_credito', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  <option value="">Sin confirmar</option>
                  <option value="En trámite">En trámite</option>
                  <option value="Pre-aprobado">Pre-aprobado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura</label>
                <select
                  value={form.temperatura}
                  onChange={e => set('temperatura', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  {TEMPERATURA_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {TEMP_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Propiedad de interés</label>
                <select
                  value={form.proyecto_id}
                  onChange={e => set('proyecto_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none"
                >
                  <option value="">Sin propiedad vinculada</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notas generales</label>
              <textarea
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 resize-none"
              />
            </div>

            {mensaje && (
              <p
                className={`text-xs px-3 py-2 rounded-lg ${
                  mensaje.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'
                }`}
              >
                {mensaje}
              </p>
            )}

            <button
              onClick={guardarCambios}
              disabled={guardando || !form.nombre.trim()}
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-60"
              style={{ background: '#C0271A' }}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* ── Columna derecha: Contactos y Comentarios ── */}
        <div className="flex flex-col gap-5">
          {/* Registro de contactos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Registro de contactos ({contactos.length})
            </h2>

            <div className="flex gap-2 mb-3">
              <select
                value={nuevoContacto.tipo}
                onChange={e =>
                  setNuevoContacto(c => ({ ...c, tipo: e.target.value as TipoContacto }))
                }
                className="text-xs px-2 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none flex-shrink-0"
              >
                <option value="llamada">📞 Llamada</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="visita">🏠 Visita</option>
              </select>
              <input
                value={nuevoContacto.descripcion}
                onChange={e => setNuevoContacto(c => ({ ...c, descripcion: e.target.value }))}
                placeholder="¿Qué se habló o acordó?"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300"
              />
              <button
                onClick={registrarContacto}
                disabled={!nuevoContacto.descripcion.trim()}
                className="text-xs px-3 py-2 rounded-lg text-white flex-shrink-0 disabled:opacity-50"
                style={{ background: '#C0271A' }}
              >
                Registrar
              </button>
            </div>

            {contactos.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Sin contactos registrados aún. Registra la primera llamada, mensaje o visita.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {contactos.map(c => (
                  <div key={c.id} className="flex gap-2.5 items-start bg-gray-50 rounded-lg p-2.5">
                    <span className="text-base flex-shrink-0">{TIPO_ICON[c.tipo]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-gray-700">{TIPO_LABEL[c.tipo]}</span>
                        <span className="text-[10px] text-gray-400">{fmtFecha(c.creado_en)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 break-words">{c.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comentarios */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Comentarios ({comentarios.length})
            </h2>

            <div className="flex gap-2 mb-3">
              <input
                value={nuevoComentario}
                onChange={e => setNuevoComentario(e.target.value)}
                placeholder="Escribe un comentario sobre este prospecto..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300"
              />
              <button
                onClick={agregarComentario}
                disabled={!nuevoComentario.trim()}
                className="text-xs px-3 py-2 rounded-lg text-white flex-shrink-0 disabled:opacity-50"
                style={{ background: '#C0271A' }}
              >
                Agregar
              </button>
            </div>

            {comentarios.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Sin comentarios aún.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {comentarios.map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-[10px] text-gray-400">{fmtFecha(c.creado_en)}</span>
                    <p className="text-xs text-gray-600 mt-0.5 break-words">{c.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
