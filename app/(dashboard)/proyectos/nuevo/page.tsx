'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

const ZONAS = ['Kanasín', 'Umán', 'Ciudad Caucel', 'Tixcacal', 'Mérida Sur', 'Otra']

export default function NuevoProyectoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    zona: '',
    metros2: '',
    recamaras: '2',
    banos: '1',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_estimada_cierre: '',
    notas: '',
  })

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: proyecto, error: err } = await supabase
      .from('proyectos')
      .insert({
        nombre: form.nombre,
        direccion: form.direccion,
        zona: form.zona,
        metros2: form.metros2 ? parseFloat(form.metros2) : null,
        recamaras: parseInt(form.recamaras),
        banos: parseInt(form.banos),
        fecha_inicio: form.fecha_inicio || null,
        fecha_estimada_cierre: form.fecha_estimada_cierre || null,
        notas: form.notas || null,
        etapa_actual: 1,
        estatus: 'activo',
        creado_por: user?.id,
      })
      .select()
      .single()

    if (err || !proyecto) {
      setError('Error al crear el proyecto. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // Insertar documentos y partidas predefinidas
    await supabase.rpc('insertar_documentos_predefinidos', { p_proyecto_id: proyecto.id })

    router.push(`/proyectos/${proyecto.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Nuevo proyecto</h1>
        <p className="text-sm text-gray-500 mt-1">Los documentos y partidas financieras se agregarán automáticamente.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre del proyecto *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required
              placeholder="ej. Calle 48 #312"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Dirección completa *</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} required
              placeholder="ej. Calle 48 #312, Col. Centro"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Zona *</label>
            <select value={form.zona} onChange={e => set('zona', e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              <option value="">Seleccionar...</option>
              {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Metros² de construcción</label>
            <input value={form.metros2} onChange={e => set('metros2', e.target.value)}
              type="number" placeholder="ej. 52"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Recámaras</label>
            <select value={form.recamaras} onChange={e => set('recamaras', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              {['1','2','3','4'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Baños</label>
            <select value={form.banos} onChange={e => set('banos', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              {['1','2','3'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de inicio</label>
            <input value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)}
              type="date"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha estimada de cierre</label>
            <input value={form.fecha_estimada_cierre} onChange={e => set('fecha_estimada_cierre', e.target.value)}
              type="date"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas iniciales</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={3} placeholder="Observaciones generales del proyecto..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-60"
            style={{ background: '#C0271A' }}>
            {loading ? 'Creando proyecto...' : 'Crear proyecto'}
          </button>
        </div>
      </form>
    </div>
  )
}
