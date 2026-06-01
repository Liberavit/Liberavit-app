// ============================================
// TIPOS Y CONSTANTES PARA LIBERAVIT
// ============================================

export const TEMPERATURA_OPTIONS = ['caliente', 'tibio', 'frio'] as const
export type TemperaturaProspecto = typeof TEMPERATURA_OPTIONS[number]

export const ESTADO_DOC_OPTIONS = ['faltante', 'tramite', 'listo'] as const
export type EstadoDocumento = typeof ESTADO_DOC_OPTIONS[number]

export const TIPO_DOC_OPTIONS = ['archivo', 'checklist'] as const
export type TipoDocumento = typeof TIPO_DOC_OPTIONS[number]

export const REQUERIDO_OPTIONS = ['obligatorio', 'opcional'] as const
export type RequeridoDocumento = typeof REQUERIDO_OPTIONS[number]

export const ROL_OPTIONS = ['admin', 'colaborador'] as const
export type Rol = typeof ROL_OPTIONS[number]

export const ESTATUS_PROYECTO_OPTIONS = ['activo', 'cerrado', 'cancelado'] as const
export type EstatusProyecto = typeof ESTATUS_PROYECTO_OPTIONS[number]

export const TIPO_PARTIDA_OPTIONS = ['egreso', 'ingreso'] as const
export type TipoPartida = typeof TIPO_PARTIDA_OPTIONS[number]

export const ESTATUS_PROSPECTO_OPTIONS = ['activo', 'descartado', 'comprador'] as const
export type EstatusProspecto = typeof ESTATUS_PROSPECTO_OPTIONS[number]

export const TIPO_SEGUIMIENTO_OPTIONS = ['llamada', 'whatsapp', 'visita', 'nota'] as const
export type TipoSeguimiento = typeof TIPO_SEGUIMIENTO_OPTIONS[number]

// ============================================
// INTERFACES DE BASE DE DATOS
// ============================================

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  creado_en: string
}

export interface Proyecto {
  id: string
  nombre: string
  direccion: string
  zona: string
  metros2: number | null
  recamaras: number | null
  banos: number | null
  etapa_actual: number
  estatus: EstatusProyecto
  fecha_inicio: string | null
  fecha_estimada_cierre: string | null
  notas: string | null
  creado_por: string | null
  creado_en: string
  actualizado_en: string
}

export interface Documento {
  id: string
  proyecto_id: string
  etapa: number
  nombre: string
  tipo: TipoDocumento
  requerido: RequeridoDocumento
  estado: EstadoDocumento
  archivo_url: string | null
  notas: string | null
  actualizado_por: string | null
  creado_en: string
  actualizado_en: string
}

export interface PartidaFinanciera {
  id: string
  proyecto_id: string
  concepto: string
  tipo: TipoPartida
  monto: number
  aplica: boolean
  notas: string | null
  registrado_por: string | null
  creado_en: string
  actualizado_en: string
}

export interface Prospecto {
  id: string
  proyecto_id: string
  nombre: string
  telefono: string | null
  email: string | null
  tipo_credito: string | null
  estado_credito: string | null
  temperatura: TemperaturaProspecto
  estatus: EstatusProspecto
  notas: string | null
  ultimo_contacto: string | null
  asignado_a: string | null
  creado_en: string
  actualizado_en: string
}

export interface SeguimientoProspecto {
  id: string
  prospecto_id: string
  tipo: TipoSeguimiento
  descripcion: string
  registrado_por: string | null
  creado_en: string
}

// ============================================
// CONSTANTES DE ETAPAS
// ============================================

export const ETAPAS = [
  { num: 1, nombre: 'Captación' },
  { num: 2, nombre: 'Negociación y due diligence' },
  { num: 3, nombre: 'Firma de contrato' },
  { num: 4, nombre: 'Remodelación y tramitología previa' },
  { num: 5, nombre: 'Comercialización (Venta)' },
  { num: 6, nombre: 'Tramitología de venta' },
  { num: 7, nombre: 'Cierre y cobranza' },
] as const

export const ETAPA_COLORES: Record<number, string> = {
  1: '#1D9E75',
  2: '#993556',
  3: '#EF9F27',
  4: '#378ADD',
  5: '#3B6D11',
  6: '#534AB7',
  7: '#5F5E5A',
}
