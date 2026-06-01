import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProyectoDetalle from '@/components/dashboard/ProyectoDetalle'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProyectoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: proyecto }, { data: documentos }, { data: partidas }, { data: prospectos }] =
    await Promise.all([
      supabase.from('proyectos').select('*').eq('id', id).single(),
      supabase.from('documentos').select('*').eq('proyecto_id', id).order('etapa').order('nombre'),
      supabase.from('partidas_financieras').select('*').eq('proyecto_id', id).order('tipo').order('concepto'),
      supabase.from('prospectos').select('*').eq('proyecto_id', id).order('creado_en', { ascending: false }),
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
