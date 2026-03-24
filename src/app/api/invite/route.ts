import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, err } from '@/lib/auth'
import { getDB, type Rol } from '@/lib/db'
import { logInviteCodes } from '@/lib/webhook'

const ROLES: Rol[] = ['command_staff','supervisory','federal_agent','visitante']

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  const db = await getDB()
  return NextResponse.json(
    Array.from(db.invites.values())
      .map(i => ({ ...i, agotado: i.usos >= i.maxUsos }))
      .sort((a,b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
  )
}

export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  const { rol, maxUsos=1, discordId, agentNumber, nombre } = await req.json().catch(()=>({}))
  if (!rol || !ROLES.includes(rol)) return err('Rol inválido')
  const db = await getDB()
  const codigo = Math.random().toString(36).substring(2,10).toUpperCase()
  const invite = {
    codigo, rol, discordId:discordId||null, agentNumber:agentNumber||null,
    nombre:nombre||null, creadoPor:u.username,
    creadoEn:new Date().toISOString(), maxUsos:Number(maxUsos)||1, usos:0, usadoPor:[],
  }
  db.invites.set(codigo, invite)
  logInviteCodes('Creada', codigo, rol, u.username)
  return NextResponse.json({ mensaje:'✅ Código creado', codigo, rol, maxUsos:Number(maxUsos)||1 }, { status:201 })
}

export async function DELETE(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  const { codigo } = await req.json().catch(()=>({}))
  const db = await getDB()
  if (!codigo || !db.invites.has(codigo)) return err('Código no encontrado', 404)
  logInviteCodes('Eliminada', codigo, db.invites.get(codigo)!.rol, u.username)
  db.invites.delete(codigo)
  return NextResponse.json({ mensaje:'✅ Código eliminado' })
}
