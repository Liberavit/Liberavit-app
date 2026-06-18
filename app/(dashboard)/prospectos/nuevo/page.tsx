'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { TEMPERATURA_OPTIONS, type TemperaturaProspecto } from '@/types'

const TEMP_LABEL: Record<string, string> = {
  caliente: '🔥 Caliente',
  tibio: '〰 Tibio',
  frio: '❄ Frío',
}

interface ProyectoOpcion {
  id: string
  nombre: string
}

export default function NuevoProspectoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [proyectos, setProyectos] = useState<ProyectoOpcion[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipo_credito: 'Infonavit',
    estado_credito: '',
    temperatura: 'frio' as TemperaturaProspecto,
    proyecto_id: '',
    notas: '',
  })

  useEffect(() => {
    async function cargarProyectos() {
      const { data } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('estatus', 'activo')
        .order('nombre')
      setProyectos(data ?? [])
    }
    cargarProyectos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: err } = await supabase
      .from('prospectos')
      .insert({
        nombre: form.nombre,
        telefono: form.telefono || null,
        email: form.email || null,
        tipo_credito: form.tipo_credito || null,
        estado_credito: form.estado_credito || null,
        temperatura: form.temperatura,
        proyecto_id: form.proyecto_id || null,
        notas: form.notas || null,
        estatus: 'activo',
        asignado_a: user?.id ?? null,
      })
      .select()
      .single()

    if (err || !data) {
      setError('Error al crear el prospecto. Intenta de nuevo.')
      setGuardando(false)
      return
    }

    router.push(`/prospectos/${data.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Nuevo prospecto</h1>
        <p className="text-sm text-gray-500 mt-1">
          Puedes registrar un prospecto sin vincularlo a una propiedad y asignársela después.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre completo *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required
              placeholder="ej. Juan García Pérez"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Teléfono</label>
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
              placeholder="ej. 9991234567"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              type="email" placeholder="ej. juan@email.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de crédito</label>
            <select value={form.tipo_credito} onChange={e => set('tipo_credito', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              <option>Infonavit</option>
              <option>Bancario</option>
              <option>Propio</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado del crédito</label>
            <select value={form.estado_credito} onChange={e => set('estado_credito', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              <option value="">Sin confirmar</option>
              <option value="En trámite">En trámite</option>
              <option value="Pre-aprobado">Pre-aprobado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Temperatura</label>
            <select value={form.temperatura} onChange={e => set('temperatura', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              {TEMPERATURA_OPTIONS.map(t => (
                <option key={t} value={t}>{TEMP_LABEL[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Propiedad de interés (opcional)</label>
            <select value={form.proyecto_id} onChange={e => set('proyecto_id', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              <option value="">Sin propiedad vinculada</option>
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas iniciales</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={3} placeholder="¿Cómo llegó este prospecto? ¿Qué busca?"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-60"
            style={{ background: '#C0271A' }}>
            {guardando ? 'Creando prospecto...' : 'Crear prospecto'}
          </button>
        </div>
      </form>
    </div>
  )
}
