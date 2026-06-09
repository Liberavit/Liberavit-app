import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProspectoDetalle from '@/components/dashboard/ProspectoDetalle'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: prospecto }, { data: seguimientos }, { data: proyectos }] =
    await Promise.all([
      supabase.from('prospectos').select('*').eq('id', id).single(),
      supabase
        .from('seguimiento_prospectos')
        .select('*')
        .eq('prospecto_id', id)
        .order('creado_en', { ascending: false }),
      supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('estatus', 'activo')
        .order('nombre'),
    ])

  if (!prospecto) notFound()

  return (
    <ProspectoDetalle
      prospecto={prospecto}
      seguimientos={seguimientos ?? []}
      proyectos={proyectos ?? []}
    />
  )
}
