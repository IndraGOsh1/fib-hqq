import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { DB } from '@/lib/db'
import { logKeyAction } from '@/lib/webhook'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id:string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  const { id } = await params
  const usr = DB.users.get(id); if (!usr) return notFound('Usuario no encontrado')
  const { rol, activo, discordId, agentNumber, nombre, callsign } = await req.json().catch(()=>({}))
  if (rol        !== undefined) usr.rol         = rol
  if (typeof activo === 'boolean') usr.activo   = activo
  if (discordId  !== undefined) usr.discordId   = discordId
  if (agentNumber!== undefined) usr.agentNumber = agentNumber
  if (nombre     !== undefined) usr.nombre      = nombre
  if (callsign   !== undefined) {
    usr.callsign = callsign
    logKeyAction('Callsign asignado', u.username, `${usr.username} → ${callsign}`)
  }
  const { passwordHash:_, ...safe } = usr
  return NextResponse.json({ mensaje:'✅ Usuario actualizado', usuario:safe })
}
