import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { getCasosDB } from '@/lib/casos-db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const CasosDB = await getCasosDB()
  const c = CasosDB.get(id); if (!c) return notFound()
  if (c.clasificacion==='confidencial' && u.rol!=='command_staff' && !c.agentesAsignados.includes(u.username)) return forbidden()
  return NextResponse.json(c)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const CasosDB = await getCasosDB()
  const c = CasosDB.get(id); if (!c) return notFound()
  if (!['command_staff','supervisory'].includes(u.rol) && c.creadoPor!==u.username) return forbidden()
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()
  if (body.titulo       !== undefined) c.titulo        = body.titulo
  if (body.descripcion  !== undefined) c.descripcion   = body.descripcion
  if (body.estado       !== undefined) {
    c.estado = body.estado
    if (body.estado === 'cerrado') c.cerradoEn = now
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion:`Estado: ${body.estado}`, detalle:body.motivo||'', autor:u.username })
  }
  if (body.prioridad !== undefined) c.prioridad = body.prioridad
  if (body.agentesAsignados !== undefined) c.agentesAsignados = body.agentesAsignados
  if (body.addSospechoso) {
    c.sospechosos.push({ id:uuid().slice(0,8), ...body.addSospechoso })
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion:'Sospechoso agregado', detalle:body.addSospechoso.nombre, autor:u.username })
  }
  if (body.addEvidencia) {
    c.evidencias.push({ id:uuid().slice(0,8), subidoPor:u.username, fecha:now, ...body.addEvidencia })
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion:'Evidencia agregada', detalle:body.addEvidencia.titulo, autor:u.username })
  }
  if (body.addNota) {
    c.notas.push({ id:uuid().slice(0,8), autor:u.username, fecha:now, contenido:body.addNota.contenido, privada:body.addNota.privada||false })
  }
  if (body.addTimeline) {
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, ...body.addTimeline, autor:u.username })
  }
  c.actualizadoEn = now
  CasosDB.set(id, c)
  return NextResponse.json({ mensaje:'✅ Caso actualizado' })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { id } = await params
  const CasosDB = await getCasosDB()
  if (!CasosDB.has(id)) return notFound()
  CasosDB.delete(id)
  return NextResponse.json({ mensaje:'✅ Caso eliminado' })
}
