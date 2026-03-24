import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { getTicketsDB } from '@/lib/tickets-db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const TicketsDB = await getTicketsDB()
  const t = TicketsDB.get(id); if (!t) return notFound()
  if (u.rol==='federal_agent' && t.creadoPor!==u.username && t.asignadoA!==u.username) return forbidden()
  return NextResponse.json(t)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const TicketsDB = await getTicketsDB()
  const t = TicketsDB.get(id); if (!t) return notFound()
  if (u.rol === 'federal_agent' && t.creadoPor !== u.username && t.asignadoA !== u.username) return forbidden()
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()
  const isSuperv = ['command_staff','supervisory'].includes(u.rol)
  if (body.estado !== undefined && isSuperv) {
    t.estado = body.estado
    if (body.estado === 'resuelto') { t.resueltoPor = u.username; t.resueltoEn = now }
  }
  if (body.asignadoA !== undefined && isSuperv) t.asignadoA = body.asignadoA
  if (body.prioridad !== undefined && isSuperv) t.prioridad = body.prioridad
  if (body.comentario) {
    const comentario = String(body.comentario).trim()
    if (comentario.length > 2000) {
      return NextResponse.json({ error: 'Comentario demasiado largo (máximo 2000)' }, { status: 400 })
    }
    t.comentarios.push({ id:uuid().slice(0,8), autor:u.username, contenido:comentario, fecha:now, interno:body.interno||false })
  }
  t.actualizadoEn = now
  TicketsDB.set(id, t)
  return NextResponse.json({ mensaje:'✅ Ticket actualizado' })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { id } = await params
  const TicketsDB = await getTicketsDB()
  if (!TicketsDB.has(id)) return notFound()
  TicketsDB.delete(id)
  return NextResponse.json({ mensaje:'✅ Eliminado' })
}
