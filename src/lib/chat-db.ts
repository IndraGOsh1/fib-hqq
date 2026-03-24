export interface Mensaje {
  id:        string
  canal:     string
  autor:     string
  nombre:    string
  callsign?: string
  contenido: string
  fecha:     string
  tipo:      'texto' | 'sistema' | 'imagen'
  leido:     string[]
}

export interface Canal {
  id:            string
  nombre:        string
  descripcion:   string
  tipo:          'general' | 'unidad' | 'dm' | 'comando' | 'supervisory'
  unidad?:       string
  participantes?: string[]
  acceso:        string[]
  creadoEn:      string
  icono?:        string
}

// Chat messages are stored as a flat table with canalId
export interface MensajeRow extends Mensaje {
  canalId: string
}

import { SupabaseMap } from './supabase-map'

declare global {
  // eslint-disable-next-line no-var
  var __fibChatV2: {
    canales:  Map<string, Canal>
    mensajes: Map<string, Mensaje[]>
  } | undefined
  var __fibChatInit: Promise<typeof global.__fibChatV2> | undefined
}

const DEFAULT_CANALES = (): Canal[] => {
  const now = new Date().toISOString()
  return [
    { id:'general',     nombre:'general',      descripcion:'Canal principal',                   tipo:'general',     acceso:['*'],                                        creadoEn:now },
    { id:'operaciones', nombre:'operaciones',   descripcion:'Coordinación operativa',            tipo:'general',     acceso:['command_staff','supervisory','federal_agent'],creadoEn:now },
    { id:'ert',         nombre:'ert',           descripcion:'Canal ERT',                         tipo:'unidad',      acceso:['*'],         icono:'🔫',                   creadoEn:now },
    { id:'cirg',        nombre:'cirg',          descripcion:'Canal CIRG',                        tipo:'unidad',      acceso:['*'],         icono:'🛡️',                   creadoEn:now },
    { id:'rrhh',        nombre:'rrhh',          descripcion:'Canal RRHH',                        tipo:'unidad',      acceso:['*'],         icono:'👥',                   creadoEn:now },
    { id:'supervisory', nombre:'supervisory',   descripcion:'Command Staff y Supervisory',       tipo:'supervisory', acceso:['command_staff','supervisory'],               creadoEn:now, icono:'⭐' },
    { id:'command',     nombre:'command-staff', descripcion:'Solo Command Staff',                tipo:'comando',     acceso:['command_staff'],                            creadoEn:now, icono:'👑' },
  ]
}

const isSupabaseEnabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)

async function initChatDB() {
  const now = new Date().toISOString()
  const defaults = DEFAULT_CANALES()

  if (isSupabaseEnabled) {
    const canalesMap = await SupabaseMap.create<'id', Canal>('chat_canales', 'id', defaults)

    // Load messages grouped by canal
    const mensajesMap = new Map<string, Mensaje[]>()
    for (const [canalId] of canalesMap) {
      mensajesMap.set(canalId, [])
    }

    // We'll load messages lazily per-canal in the API route instead
    // to avoid loading all messages at once. Set empty arrays here.
    global.__fibChatV2 = { canales: canalesMap, mensajes: mensajesMap }
    return global.__fibChatV2
  }

  // In-memory fallback
  if (!global.__fibChatV2) {
    global.__fibChatV2 = { canales: new Map(), mensajes: new Map() }
    defaults.forEach(c => {
      global.__fibChatV2!.canales.set(c.id, c)
      global.__fibChatV2!.mensajes.set(c.id, [{
        id:`sys-${c.id}`, canal:c.id, autor:'SYSTEM', nombre:'Sistema FIB',
        contenido: c.tipo==='comando' ? 'Canal confidencial — solo Command Staff.' :
                   c.tipo==='supervisory' ? 'Canal restringido — Command Staff y Supervisory.' :
                   `Bienvenidos a #${c.nombre}.`,
        fecha:now, tipo:'sistema', leido:[]
      }])
    })
  }
  return global.__fibChatV2
}

if (!global.__fibChatInit) {
  global.__fibChatInit = initChatDB()
}

export async function getChatDB() {
  await global.__fibChatInit
  return global.__fibChatV2!
}

export const ChatDB = new Proxy({} as typeof global.__fibChatV2 & {}, {
  get(_t, prop) {
    if (!global.__fibChatV2) throw new Error('[ChatDB] Acceso antes de inicializar.')
    return (global.__fibChatV2 as any)[prop]
  }
}) as { canales: Map<string, Canal>; mensajes: Map<string, Mensaje[]> }

export function canAccess(canal: Canal, rol: string, username: string): boolean {
  if (canal.tipo === 'dm') return canal.participantes?.includes(username) || false
  if (canal.acceso.includes('*')) return true
  return canal.acceso.includes(rol)
}

export function getOrCreateDM(u1: string, u2: string): Canal {
  const id = 'dm-' + [u1,u2].sort().join('__')
  if (!ChatDB.canales.has(id)) {
    const c: Canal = { id, nombre:id, descripcion:'DM', tipo:'dm', acceso:[u1,u2], participantes:[u1,u2], creadoEn:new Date().toISOString() }
    ChatDB.canales.set(id, c)
    ChatDB.mensajes.set(id, [])
  }
  return ChatDB.canales.get(id)!
}

export function countUnreadDMs(username: string): number {
  let n = 0
  for (const [id, canal] of ChatDB.canales) {
    if (canal.tipo !== 'dm' || !canal.participantes?.includes(username)) continue
    n += (ChatDB.mensajes.get(id)||[]).filter(m => m.autor!==username && !m.leido.includes(username)).length
  }
  return n
}

export function markRead(canalId: string, username: string) {
  ;(ChatDB.mensajes.get(canalId)||[]).forEach(m => { if (!m.leido.includes(username)) m.leido.push(username) })
}
