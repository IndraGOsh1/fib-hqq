export interface Anotacion {
  id:       string
  titulo:   string
  contenido:string
  fecha:    string
  privada:  boolean
}

export interface CarpetaPersonal {
  username:   string
  anotaciones:Anotacion[]
  documentos: { id:string; nombre:string; descripcion:string; fecha:string; url?:string }[]
}

declare global { var __fibCarpetas: Map<string, CarpetaPersonal> | undefined }
if (!global.__fibCarpetas) { global.__fibCarpetas = new Map() }
export const CarpetasDB = global.__fibCarpetas!

export function getCarpeta(username: string): CarpetaPersonal {
  if (!CarpetasDB.has(username)) {
    CarpetasDB.set(username, { username, anotaciones:[], documentos:[] })
  }
  return CarpetasDB.get(username)!
}
