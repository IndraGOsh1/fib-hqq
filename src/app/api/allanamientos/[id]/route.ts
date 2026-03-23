import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { AllanamientosDB } from '@/lib/allanamientos-db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const a = AllanamientosDB.get(id); if (!a) return notFound()
  if (u.rol==='federal_agent' && a.solicitadoPor!==u.username) return forbidden()
  return NextResponse.json(a)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const a = AllanamientosDB.get(id); if (!a) return notFound()
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()
  if (body.accion === 'autorizar') {
    if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
    a.estado = 'autorizado'; a.autorizadoPor = u.username; a.autorizadoEn = now
    a.observaciones = body.observaciones || a.observaciones
  }
  if (body.accion === 'denegar') {
    if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
    a.estado = 'denegado'; a.motivoDenegacion = body.motivo || 'Sin motivo'
  }
  if (body.accion === 'ejecutar') {
    if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
    a.estado = 'ejecutado'; a.fechaEjecucion = now
  }
  if (body.accion === 'generar_pdf') a.pdfGenerado = true
  if (body.observaciones !== undefined) a.observaciones = body.observaciones
  a.actualizadoEn = now
  AllanamientosDB.set(id, a)
  return NextResponse.json({ mensaje:'✅ Allanamiento actualizado', estado: a.estado })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { id } = await params
  if (!AllanamientosDB.has(id)) return notFound()
  AllanamientosDB.delete(id)
  return NextResponse.json({ mensaje:'✅ Eliminado' })
}
