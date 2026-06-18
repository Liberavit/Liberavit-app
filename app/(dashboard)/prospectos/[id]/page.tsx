import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProspectoDetalle from '@/components/dashboard/ProspectoDetalle'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Usamos maybeSingle() en lugar de single() para que no truene
  // si la fila no se encuentra; así controlamos el notFound manualmente.
  const { data: prospecto } = await supabase
    .from('prospectos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!prospecto) notFound()

  const [{ data: seguimientos }, { data: proyectos }] = await Promise.all([
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

  return (
    <ProspectoDetalle
      prospecto={prospecto}
      seguimientos={seguimientos ?? []}
      proyectos={proyectos ?? []}
    />
  )
}
