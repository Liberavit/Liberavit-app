import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente de Supabase con permisos de servicio (no de usuario)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Verificar que la solicitud viene de Make (seguridad básica)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, telefono, email, fuente } = body

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Crear el prospecto en Supabase
    const { data, error } = await supabase
      .from('prospectos')
      .insert({
        nombre,
        telefono: telefono || null,
        email: email || null,
        tipo_credito: 'Infonavit',
        temperatura: 'frio',
        estatus: 'activo',
        notas: fuente ? `Fuente: ${fuente}` : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear prospecto:', error)
      return NextResponse.json({ error: 'Error al crear prospecto' }, { status: 500 })
    }

    return NextResponse.json({ success: true, prospecto_id: data.id }, { status: 201 })

  } catch (err) {
    console.error('Error en el endpoint:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
