import { NextRequest, NextResponse } from 'next/server'
import { getUser, forbidden } from '@/lib/auth'
import { ConfigVisualDB } from '@/lib/config-visual-db'

// GET — público, cualquiera puede leer la config visual
export async function GET() {
  return NextResponse.json(ConfigVisualDB.get())
}

// PATCH — solo Command Staff
export async function PATCH(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()

  const body = await req.json().catch(() => ({}))

  ConfigVisualDB.set({
    ...body,
    actualizadoPor: u.username,
    actualizadoEn:  new Date().toISOString(),
  })

  return NextResponse.json({ mensaje: '✅ Configuración guardada', config: ConfigVisualDB.get() })
}

// DELETE — reset a valores por defecto
export async function DELETE(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  ConfigVisualDB.reset()
  return NextResponse.json({ mensaje: '✅ Configuración restablecida' })
}
