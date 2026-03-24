export type EstadoAllanamiento = 'pendiente' | 'autorizado' | 'denegado' | 'ejecutado'

export interface Firma {
  username:  string
  nombre:    string
  callsign:  string | null
  rol:       string
  fecha:     string
  tipo:      'autorizacion' | 'fiscal' | 'supervisor'
}

export interface MensajeAllanamiento {
  id:        string
  autor:     string
  nombre:    string
  contenido: string
  fecha:     string
  tipo:      'mensaje' | 'sistema' | 'accion'
}

export interface Allanamiento {
  id:               string
  numeroSolicitud:  string
  direccion:        string
  motivacion:       string
  descripcion:      string
  sospechoso:       string
  casoVinculado:    string | null
  estado:           EstadoAllanamiento
  solicitadoPor:    string
  nombreSolicitante:string
  callsignSolicitante: string | null
  unidad:           string
  fechaSolicitud:   string
  fechaEjecucion?:  string
  firmas:           Firma[]
  motivoDenegacion: string | null
  observaciones:    string
  mensajes:         MensajeAllanamiento[]
  actualizadoEn:    string
}

declare global {
  // eslint-disable-next-line no-var
  var __fibAllanamientos: Map<string,Allanamiento> | undefined
}
if (!global.__fibAllanamientos) { global.__fibAllanamientos = new Map() }
export const AllanamientosDB = global.__fibAllanamientos!

let counter = 1
export function nextAllNumber() {
  return 'ALL-' + new Date().getFullYear() + '-' + String(counter++).padStart(3,'0')
}
