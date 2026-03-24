import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { DB } from '@/lib/db'
import { signToken, err, unauthorized } from '@/lib/auth'
import { logLogin } from '@/lib/webhook'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(()=>({}))
  if (!username || !password) return err('username y password requeridos')
  let found = null
  for (const u of DB.users.values())
    if (u.username.toLowerCase() === username.toLowerCase()) { found = u; break }
  if (!found) return unauthorized()
  if (!found.activo) return err('Cuenta desactivada', 403)
  if (!await bcrypt.compare(password, found.passwordHash)) return unauthorized()
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
  logLogin(found.username, found.rol, ip)
  const token = signToken({ id:found.id, username:found.username, rol:found.rol, nombre:found.nombre, agentNumber:found.agentNumber, callsign:found.callsign })
  return NextResponse.json({ token, usuario:{ id:found.id, username:found.username, rol:found.rol, nombre:found.nombre, agentNumber:found.agentNumber, discordId:found.discordId, callsign:found.callsign } })
}
