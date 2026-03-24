export interface Anotacion { id:string; titulo:string; contenido:string; fecha:string; privada:boolean }
import { SupabaseMap } from './supabase-map'

export interface Anotacion {
  id: string
  titulo: string
  contenido: string
  fecha: string
  privada: boolean
}

export interface CarpetaDocumento {
  id: string
  nombre: string
  descripcion: string
  fecha: string
}

export interface CarpetaPersonal {
  username: string
  anotaciones: Anotacion[]
  documentos: CarpetaDocumento[]
}

declare global {
  // eslint-disable-next-line no-var
  var __fibCarpetas: Map<string, CarpetaPersonal> | undefined
  // eslint-disable-next-line no-var
  var __fibCarpetasInit: Promise<Map<string, CarpetaPersonal>> | undefined
}

const isSupabaseEnabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)

async function initCarpetas() {
  if (isSupabaseEnabled) {
    return SupabaseMap.create<'username', CarpetaPersonal>('carpetas', 'username')
  }
  if (!global.__fibCarpetas) global.__fibCarpetas = new Map<string, CarpetaPersonal>()
  return global.__fibCarpetas
}

if (!global.__fibCarpetasInit) {
  global.__fibCarpetasInit = initCarpetas().then(db => {
    global.__fibCarpetas = db
    return db
  })
}

export async function getCarpetasDB() {
  return global.__fibCarpetasInit as Promise<Map<string, CarpetaPersonal>>
}

export async function getCarpeta(username: string): Promise<CarpetaPersonal> {
  const db = await getCarpetasDB()
  if (!db.has(username)) db.set(username, { username, anotaciones: [], documentos: [] })
  return db.get(username) as CarpetaPersonal
}
