import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { getOpsDB } from '@/lib/operativos-db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u  = getUser(req)
  const { id } = await params
  const OpsDB = await getOpsDB()
  const op = OpsDB.get(id); if (!op) return notFound()
  if (!u) {
    if (op.estado !== 'publicado' || op.clasificacion === 'confidencial') return notFound('No encontrado')
    return NextResponse.json(op)
  }
  if (op.clasificacion==='confidencial' && u.rol!=='command_staff') return forbidden()
  if (op.estado==='borrador' && op.creadoPor!==u.username && u.rol!=='command_staff') return forbidden()
  return NextResponse.json(op)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const OpsDB = await getOpsDB()
  const op = OpsDB.get(id); if (!op) return notFound()
  if (op.creadoPor !== u.username && u.rol !== 'command_staff') return forbidden()
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()
  if (body.titulo        !== undefined) op.titulo        = body.titulo.trim()
  if (body.descripcion   !== undefined) op.descripcion   = body.descripcion.trim()
  if (body.contenido     !== undefined) op.contenido     = body.contenido.trim()
  if (body.bloques       !== undefined) op.bloques       = body.bloques
  if (body.imagenes      !== undefined) op.imagenes      = body.imagenes
  if (body.clasificacion !== undefined) op.clasificacion = body.clasificacion
  if (body.unidad        !== undefined) op.unidad        = body.unidad
  if (body.tags          !== undefined) op.tags          = body.tags
  if (body.accion === 'aprobar' && ['command_staff','supervisory'].includes(u.rol)) {
    op.estado = 'publicado'; op.aprobadoPor = u.username; op.aprobadoEn = now
  }
  if (body.accion === 'rechazar' && ['command_staff','supervisory'].includes(u.rol)) op.estado = 'borrador'
  if (body.accion === 'archivar' && u.rol === 'command_staff') op.estado = 'archivado'
  if (body.accion === 'pendiente') op.estado = 'pendiente'
  op.actualizadoEn = now
  OpsDB.set(id, op)
  return NextResponse.json({ mensaje:'✅ Actualizado', estado: op.estado })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const OpsDB = await getOpsDB()
  const op = OpsDB.get(id); if (!op) return notFound()
  if (op.creadoPor !== u.username && u.rol !== 'command_staff') return forbidden()
  OpsDB.delete(id)
  return NextResponse.json({ mensaje:'✅ Eliminado' })
}
