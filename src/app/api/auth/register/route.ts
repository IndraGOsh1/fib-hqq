import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { getDB } from '@/lib/db'
import { signToken, err } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password, codigo, nombre } = await req.json().catch(() => ({}))
  if (!username?.trim() || !password || !codigo?.trim())
    return err('username, password y codigo son requeridos')

  const { users, invites } = await getDB()
  const inv = invites.get(codigo.trim())
  if (!inv) return err('Código de invitación inválido')
  if (inv.usos >= inv.maxUsos) return err(`Código agotado (${inv.usos}/${inv.maxUsos} usos)`)

  for (const u of users.values())
    if (u.username.toLowerCase() === username.toLowerCase())
      return err('Ese nombre de usuario ya existe')

  const id = uuid()
  const passwordHash = await bcrypt.hash(password, 12)
  const user = {
    id, username: username.trim(), passwordHash,
    rol: inv.rol, discordId: inv.discordId,
    agentNumber: inv.agentNumber,
    nombre: nombre?.trim() || inv.nombre || null,
    createdAt: new Date().toISOString(), activo: true,
  }
  users.set(id, user)
  inv.usos++; inv.usadoPor.push(username.trim())

  const token = signToken({ id, username: user.username, rol: user.rol, nombre: user.nombre, agentNumber: user.agentNumber })
  return NextResponse.json({ token, usuario: { id, username: user.username, rol: user.rol, nombre: user.nombre, agentNumber: user.agentNumber } }, { status: 201 })
}
