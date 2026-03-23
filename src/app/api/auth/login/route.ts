import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { signToken, err, unauthorized } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}))
  if (!username || !password) return err('username y password requeridos')

  const { users } = await getDB()
  let found = null
  for (const u of users.values())
    if (u.username.toLowerCase() === username.toLowerCase()) { found = u; break }

  if (!found) return unauthorized()
  if (!found.activo) return err('Cuenta desactivada', 403)
  if (!await bcrypt.compare(password, found.passwordHash)) return unauthorized()

  const token = signToken({ id: found.id, username: found.username, rol: found.rol, nombre: found.nombre, agentNumber: found.agentNumber })
  return NextResponse.json({ token, usuario: { id: found.id, username: found.username, rol: found.rol, nombre: found.nombre, agentNumber: found.agentNumber, discordId: found.discordId } })
}
