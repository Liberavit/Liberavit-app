'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter, useParams } from 'next/navigation'
import { ESTATUS_PROYECTO_OPTIONS, type EstatusProyecto } from '@/types'

const ZONAS = ['Kanasín', 'Umán', 'Ciudad Caucel', 'Tixcacal', 'Mérida Sur', 'Otra']

const ESTATUS_LABEL: Record<EstatusProyecto, string> = {
  activo: 'Activo',
  archivado: 'Archivado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
}

interface FormState {
  nombre: string
  direccion: string
  zona: string
  metros2: string
  recamaras: string
  banos: string
  fecha_inicio: string
  fecha_estimada_cierre: string
  notas: string
  estatus: EstatusProyecto
}

export default function EditarProyectoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id
  const supabase = createClient()

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>({
    nombre: '',
    direccion: '',
    zona: '',
    metros2: '',
    recamaras: '2',
    banos: '1',
    fecha_inicio: '',
    fecha_estimada_cierre: '',
    notas: '',
    estatus: 'activo',
  })

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('proyectos').select('*').eq('id', id).single()
      if (data) {
        setForm({
          nombre: data.nombre ?? '',
          direccion: data.direccion ?? '',
          zona: data.zona ?? '',
          metros2: data.metros2 != null ? String(data.metros2) : '',
          recamaras: data.recamaras != null ? String(data.recamaras) : '2',
          banos: data.banos != null ? String(data.banos) : '1',
          fecha_inicio: data.fecha_inicio ?? '',
          fecha_estimada_cierre: data.fecha_estimada_cierre ?? '',
          notas: data.notas ?? '',
          estatus: data.estatus ?? 'activo',
        })
      }
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const { error: err } = await supabase
      .from('proyectos')
      .update({
        nombre: form.nombre,
        direccion: form.direccion,
        zona: form.zona,
        metros2: form.metros2 ? parseFloat(form.metros2) : null,
        recamaras: parseInt(form.recamaras),
        banos: parseInt(form.banos),
        fecha_inicio: form.fecha_inicio || null,
        fecha_estimada_cierre: form.fecha_estimada_cierre || null,
        notas: form.notas || null,
        estatus: form.estatus,
      })
      .eq('id', id)

    if (err) {
      setError('Error al guardar los cambios. Intenta de nuevo.')
      setGuardando(false)
      return
    }

    router.push(`/proyectos/${id}`)
    router.refresh()
  }

  if (cargando) {
    return <p className="text-sm text-gray-400 text-center py-10">Cargando proyecto...</p>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Editar proyecto</h1>
        <p className="text-sm text-gray-500 mt-1">Modifica la información del proyecto y guarda los cambios.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre del proyecto *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Dirección completa *</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Zona *</label>
            <select value={form.zona} onChange={e => set('zona', e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              <option value="">Seleccionar...</option>
              {!ZONAS.includes(form.zona) && form.zona !== '' && (
                <option value={form.zona}>{form.zona}</option>
              )}
              {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Metros² de construcción</label>
            <input value={form.metros2} onChange={e => set('metros2', e.target.value)}
              type="number"
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estatus del proyecto</label>
            <select value={form.estatus} onChange={e => set('estatus', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-300 bg-white">
              {ESTATUS_PROYECTO_OPTIONS.map(s => (
                <option key={s} value={s}>{ESTATUS_LABEL[s]}</option>
              ))}
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={3}
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
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
