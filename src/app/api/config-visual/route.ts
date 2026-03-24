import { NextRequest, NextResponse } from 'next/server'
import { getUser, forbidden } from '@/lib/auth'
import { ConfigVisualDB } from '@/lib/config-visual-db'

export async function GET() {
  return NextResponse.json(ConfigVisualDB.get())
}

export async function PATCH(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  const body = await req.json().catch(()=>({}))
  ConfigVisualDB.set({ ...body, actualizadoPor:u.username, actualizadoEn:new Date().toISOString() })
  return NextResponse.json({ mensaje:'✅ Configuración guardada', config:ConfigVisualDB.get() })
}

export async function DELETE(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  ConfigVisualDB.reset()
  return NextResponse.json({ mensaje:'✅ Restablecido' })
}
