export type Rol = 'command_staff' | 'supervisory' | 'federal_agent' | 'visitante'

export interface User {
  id:          string
  username:    string
  passwordHash:string
  rol:         Rol
  discordId:   string | null
  agentNumber: string | null
  nombre:      string | null
  createdAt:   string
  activo:      boolean
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

// Tipo unificado: tanto Map<string,T> como SupabaseMap son Map<string,T>
export type UserMap   = Map<string, User>
export type InviteMap = Map<string, Invite>

declare global {
  // eslint-disable-next-line no-var
  var __fib: { users: UserMap; invites: InviteMap } | undefined
  var __fibDB: Promise<{ users: UserMap; invites: InviteMap }> | undefined
}

const initialInvites: Invite[] = [
  {
    codigo: 'indraputo0%0', rol: 'command_staff',
    discordId: null, agentNumber: null, nombre: null,
    creadoPor: 'SYSTEM', creadoEn: new Date().toISOString(),
    maxUsos: 2, usos: 0, usadoPor: [],
  }
]

if (!global.__fib) {
  global.__fib = { users: new Map(), invites: new Map() }
}

const isSupabaseEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL

async function initDB(): Promise<{ users: UserMap; invites: InviteMap }> {
  if (isSupabaseEnabled) {
    const users   = await SupabaseMap.create<'id', User>('users', 'id', [])
    const invites = await SupabaseMap.create<'codigo', Invite>('invites', 'codigo', initialInvites)
    return { users, invites }
  }
  return { users: global.__fib!.users, invites: global.__fib!.invites }
}

if (!global.__fibDB) {
  global.__fibDB = initDB()
}

export async function getDB(): Promise<{ users: UserMap; invites: InviteMap }> {
  return global.__fibDB!
}
