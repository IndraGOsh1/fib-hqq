export type Rol = 'command_staff' | 'supervisory' | 'federal_agent' | 'visitante'

export interface User {
  id:           string
  username:     string
  passwordHash: string
  rol:          Rol
  discordId:    string | null
  agentNumber:  string | null
  nombre:       string | null
  callsign:     string | null
  createdAt:    string
  activo:       boolean
  vetado?:      boolean
  vetoReason?:  string | null
  vetoAt?:      string | null
  vetoBy?:      string | null
}

export interface Invite {
  codigo:      string
  rol:         Rol
  discordId:   string | null
  agentNumber: string | null
  nombre:      string | null
  creadoPor:   string
  creadoEn:    string
  maxUsos:     number
  usos:        number
  usadoPor:    string[]
}

import { SupabaseMap } from './supabase-map'

const BOOTSTRAP_INVITE_CODE = 'FIB-CS-BOOTSTRAP'

const INITIAL_INVITE: Invite = {
  codigo: BOOTSTRAP_INVITE_CODE, rol:'command_staff',
  discordId:null, agentNumber:null, nombre:null,
  creadoPor:'SYSTEM', creadoEn:new Date().toISOString(),
  maxUsos:2, usos:0, usadoPor:[],
}

declare global {
  // eslint-disable-next-line no-var
  var __fibDB: { users: Map<string,User>; invites: Map<string,Invite> } | undefined
  var __fibDBInit: Promise<{ users: Map<string,User>; invites: Map<string,Invite> }> | undefined
}

const isSupabaseEnabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)

async function initDB() {
  if (isSupabaseEnabled) {
    const [users, invites] = await Promise.all([
      SupabaseMap.create<'id', User>('users', 'id'),
      SupabaseMap.create<'codigo', Invite>('invites', 'codigo', [INITIAL_INVITE]),
    ])
    return { users, invites }
  }
  if (!global.__fibDB) {
    global.__fibDB = { users: new Map(), invites: new Map() }
    global.__fibDB.invites.set(BOOTSTRAP_INVITE_CODE, INITIAL_INVITE)
  }
  return global.__fibDB!
}

if (!global.__fibDBInit) {
  global.__fibDBInit = initDB().then(db => {
    global.__fibDB = db
    return db
  })
}

export async function getDB() {
  return global.__fibDBInit!
}

export const DB = new Proxy({} as { users: Map<string,User>; invites: Map<string,Invite> }, {
  get(_t, prop) {
    if (!global.__fibDB) throw new Error('[DB] Acceso antes de inicializar. Usa getDB() en rutas async.')
    return (global.__fibDB as any)[prop]
  }
})
