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

declare global {
  // eslint-disable-next-line no-var
  var __fibDB: { users: Map<string,User>; invites: Map<string,Invite> } | undefined
}

if (!global.__fibDB) {
  global.__fibDB = { users: new Map(), invites: new Map() }
  global.__fibDB.invites.set('indraputo0%0', {
    codigo:'indraputo0%0', rol:'command_staff',
    discordId:null, agentNumber:null, nombre:null,
    creadoPor:'SYSTEM', creadoEn:new Date().toISOString(),
    maxUsos:2, usos:0, usadoPor:[],
  })
}

export const DB = global.__fibDB
