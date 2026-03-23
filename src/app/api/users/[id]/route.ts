import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { getDB } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { id } = await params
  const { users } = await getDB()
  const usr = users.get(id); if (!usr) return notFound('Usuario no encontrado')
  const { rol, activo, discordId, agentNumber, nombre } = await req.json().catch(()=>({}))
  if (rol    !== undefined) usr.rol         = rol
  if (typeof activo === 'boolean') usr.activo = activo
  if (discordId   !== undefined) usr.discordId   = discordId
  if (agentNumber !== undefined) usr.agentNumber = agentNumber
  if (nombre      !== undefined) usr.nombre      = nombre
  const { passwordHash: _, ...safe } = usr
  return NextResponse.json({ mensaje:'✅ Usuario actualizado', usuario: safe })
}
