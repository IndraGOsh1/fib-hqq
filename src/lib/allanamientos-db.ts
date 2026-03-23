export type EstadoAllanamiento = 'borrador' | 'pendiente' | 'autorizado' | 'denegado' | 'ejecutado'

export interface Allanamiento {
  id:              string
  numeroSolicitud: string
  direccion:       string
  motivacion:      string
  descripcion:     string
  sospechoso:      string
  casoVinculado:   string | null
  estado:          EstadoAllanamiento
  solicitadoPor:   string
  nombreSolicitante:string
  unidad:          string
  fechaSolicitud:  string
  fechaEjecucion?: string
  autorizadoPor:   string | null
  autorizadoEn:    string | null
  motivoDenegacion:string | null
  observaciones:   string
  pdfGenerado:     boolean
  actualizadoEn:   string
}

declare global { var __fibAllanamientos: Map<string, Allanamiento> | undefined }
if (!global.__fibAllanamientos) {
  global.__fibAllanamientos = new Map()
  const now = new Date().toISOString()
  global.__fibAllanamientos.set('all-001', {
    id:'all-001', numeroSolicitud:'ALL-2024-001',
    direccion:'Calle 5 #23, Zona Industrial',
    motivacion:'Evidencia de actividad criminal vinculada al caso FIB-2024-001',
    descripcion:'Se solicita autorización para allanamiento de bodega sospechosa.',
    sospechoso:'John Doe (El Fantasma)',
    casoVinculado:'caso-001', estado:'pendiente',
    solicitadoPor:'Agente1', nombreSolicitante:'Agente Federal',
    unidad:'CIRG', fechaSolicitud:now,
    autorizadoPor:null, autorizadoEn:null, motivoDenegacion:null,
    observaciones:'', pdfGenerado:false, actualizadoEn:now,
  })
}
export const AllanamientosDB = global.__fibAllanamientos!

let allCounter = 2
export function nextAllNumber() {
  return `ALL-${new Date().getFullYear()}-${String(allCounter++).padStart(3,'0')}`
}
