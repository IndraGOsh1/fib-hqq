import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound, err } from '@/lib/auth'
import { getCasosDB } from '@/lib/casos-db'

const ESTADOS = new Set(['abierto', 'en_progreso', 'cerrado', 'archivado'])
const PRIORIDADES = new Set(['baja', 'media', 'alta', 'critica'])

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
  if (body.titulo !== undefined) {
    const titulo = String(body.titulo).trim()
    if (!titulo || titulo.length > 180) return err('Titulo invalido (1-180 caracteres)')
    c.titulo = titulo
  }
  if (body.descripcion !== undefined) {
    const descripcion = String(body.descripcion).trim()
    if (descripcion.length > 4000) return err('Descripcion demasiado larga (maximo 4000)')
    c.descripcion = descripcion
  }
  if (body.estado       !== undefined) {
    const estado = String(body.estado)
    if (!ESTADOS.has(estado)) return err('Estado invalido')
    c.estado = estado as any
    if (estado === 'cerrado') c.cerradoEn = now
    const motivo = String(body.motivo || '').slice(0, 300)
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion:`Estado: ${estado}`, detalle:motivo, autor:u.username })
  }
  if (body.prioridad !== undefined) {
    const prioridad = String(body.prioridad)
    if (!PRIORIDADES.has(prioridad)) return err('Prioridad invalida')
    c.prioridad = prioridad as any
  }
  if (body.agentesAsignados !== undefined) {
    if (!Array.isArray(body.agentesAsignados)) return err('agentesAsignados debe ser un arreglo')
    const agentes = body.agentesAsignados.map((x: any) => String(x).trim()).filter(Boolean)
    if (agentes.length > 50) return err('Demasiados agentes asignados')
    c.agentesAsignados = agentes
  }
  if (body.addSospechoso) {
    const nombre = String(body.addSospechoso?.nombre || '').trim()
    if (!nombre || nombre.length > 160) return err('Sospechoso invalido: nombre requerido (maximo 160)')
    const sospechoso = {
      id: uuid().slice(0,8),
      nombre,
      alias: String(body.addSospechoso?.alias || '').slice(0, 120),
      descripcion: String(body.addSospechoso?.descripcion || '').slice(0, 500),
      estado: ['buscado','detenido','liberado','profugo', 'prófugo'].includes(String(body.addSospechoso?.estado || 'buscado'))
        ? (String(body.addSospechoso?.estado || 'buscado') === 'profugo' ? 'prófugo' : String(body.addSospechoso?.estado || 'buscado'))
        : 'buscado',
    }
    c.sospechosos.push(sospechoso as any)
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion:'Sospechoso agregado', detalle:nombre, autor:u.username })
  }
  if (body.addEvidencia) {
    const titulo = String(body.addEvidencia?.titulo || '').trim()
    if (!titulo || titulo.length > 180) return err('Evidencia invalida: titulo requerido (maximo 180)')
    const evidencia = {
      id: uuid().slice(0,8),
      titulo,
      tipo: String(body.addEvidencia?.tipo || 'otro').slice(0, 80),
      descripcion: String(body.addEvidencia?.descripcion || '').slice(0, 1200),
      subidoPor: u.username,
      fecha: now,
      url: body.addEvidencia?.url ? String(body.addEvidencia.url).slice(0, 1000) : undefined,
    }
    c.evidencias.push(evidencia as any)
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion:'Evidencia agregada', detalle:titulo, autor:u.username })
  }
  if (body.addNota) {
    const contenido = String(body.addNota?.contenido || '').trim()
    if (!contenido || contenido.length > 3000) return err('Nota invalida (1-3000 caracteres)')
    c.notas.push({ id:uuid().slice(0,8), autor:u.username, fecha:now, contenido, privada:!!body.addNota?.privada })
  }
  if (body.addTimeline) {
    const accion = String(body.addTimeline?.accion || '').trim()
    if (!accion || accion.length > 120) return err('Timeline invalido: accion requerida (maximo 120)')
    const detalle = String(body.addTimeline?.detalle || '').slice(0, 600)
    c.timeline.push({ id:uuid().slice(0,8), fecha:now, accion, detalle, autor:u.username })
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
