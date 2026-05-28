import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProyectoDetalle from '@/components/dashboard/ProyectoDetalle'

export default async function ProyectoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [{ data: proyecto }, { data: documentos }, { data: partidas }, { data: prospectos }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', params.id).single(),
    supabase.from('documentos').select('*').eq('proyecto_id', params.id).order('etapa').order('nombre'),
    supabase.from('partidas_financieras').select('*').eq('proyecto_id', params.id).order('tipo').order('concepto'),
    supabase.from('prospectos').select('*').eq('proyecto_id', params.id).order('creado_en', { ascending: false }),
  ])

  if (!proyecto) notFound()

  return (
    <ProyectoDetalle
      proyecto={proyecto}
      documentos={documentos ?? []}
      partidas={partidas ?? []}
      prospectos={prospectos ?? []}
    />
  )
}
