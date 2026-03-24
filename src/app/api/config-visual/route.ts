import { NextRequest, NextResponse } from 'next/server'
import { getUser, forbidden } from '@/lib/auth'
import { ConfigVisualDB } from '@/lib/config-visual-db'

function sanitizeOposicionesInfo(raw: any) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const datos = Array.isArray(source.datos)
    ? source.datos.map((x: any) => String(x || '').trim().slice(0, 240)).filter(Boolean).slice(0, 12)
    : []
  const imagenes = Array.isArray(source.imagenes)
    ? source.imagenes.map((x: any) => String(x || '').trim().slice(0, 2000)).filter(Boolean).slice(0, 10)
    : []

  return {
    titulo: String(source.titulo || 'Oposiciones').trim().slice(0, 120),
    descripcion: String(source.descripcion || '').trim().slice(0, 3000),
    datos,
    imagenes,
  }
}

export async function GET() {
  return NextResponse.json(ConfigVisualDB.get())
}

export async function PATCH(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  const body = await req.json().catch(() => ({}))

  const next: Record<string, unknown> = { ...body }
  const isIndra = String(u.username || '').toLowerCase() === 'indra'

  if (!isIndra) {
    delete next.textoMision
    delete next.descripcionDivision
    delete next.oposicionesInfo
  }

  if (next.oposicionesInfo !== undefined) {
    next.oposicionesInfo = sanitizeOposicionesInfo(next.oposicionesInfo)
  }

  ConfigVisualDB.set({ ...next, actualizadoPor: u.username, actualizadoEn: new Date().toISOString() })
  return NextResponse.json({ mensaje:'✅ Configuración guardada', config:ConfigVisualDB.get() })
}

export async function DELETE(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  ConfigVisualDB.reset()
  return NextResponse.json({ mensaje:'✅ Restablecido' })
}
