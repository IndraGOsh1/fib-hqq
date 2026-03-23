import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, err } from '@/lib/auth'
import { getDB, type Rol } from '@/lib/db'

const ROLES: Rol[] = ['command_staff','supervisory','federal_agent','visitante']

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { invites } = await getDB()
  return NextResponse.json(Array.from(invites.values()).map(i => ({...i, agotado: i.usos >= i.maxUsos})).sort((a,b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()))
}

export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()

  const { rol, maxUsos=1, discordId, agentNumber, nombre } = await req.json().catch(() => ({}))
  if (!rol || !ROLES.includes(rol)) return err(`Rol inválido. Válidos: ${ROLES.join(', ')}`)

  const { invites } = await getDB()
  const codigo = Math.random().toString(36).substring(2,10).toUpperCase()
  invites.set(codigo, {
    codigo, rol, discordId: discordId||null, agentNumber: agentNumber||null,
    nombre: nombre||null, creadoPor: u.username,
    creadoEn: new Date().toISOString(),
    maxUsos: Number(maxUsos)||1, usos:0, usadoPor:[],
  })
  return NextResponse.json({ mensaje:'✅ Código creado', codigo, rol, maxUsos: Number(maxUsos)||1 }, { status:201 })
}

export async function DELETE(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { codigo } = await req.json().catch(() => ({}))
  const { invites } = await getDB()
  if (!codigo || !invites.has(codigo)) return err('Código no encontrado', 404)
  invites.delete(codigo)
  return NextResponse.json({ mensaje:'✅ Código eliminado' })
}
