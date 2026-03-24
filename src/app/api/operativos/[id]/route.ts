import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound, err } from '@/lib/auth'
import { getOpsDB } from '@/lib/operativos-db'

const CLASIFICACIONES = new Set(['publico', 'interno', 'confidencial'])
const ACCIONES = new Set(['aprobar', 'rechazar', 'archivar', 'pendiente'])

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
  if (body.titulo !== undefined) {
    const titulo = String(body.titulo).trim()
    if (!titulo || titulo.length > 180) return err('Titulo invalido (1-180 caracteres)')
    op.titulo = titulo
  }
  if (body.descripcion !== undefined) {
    const descripcion = String(body.descripcion).trim()
    if (descripcion.length > 3000) return err('Descripcion demasiado larga (maximo 3000)')
    op.descripcion = descripcion
  }
  if (body.contenido !== undefined) {
    const contenido = String(body.contenido).trim()
    if (contenido.length > 12000) return err('Contenido demasiado largo (maximo 12000)')
    op.contenido = contenido
  }
  if (body.bloques !== undefined) {
    if (!Array.isArray(body.bloques)) return err('bloques debe ser un arreglo')
    if (body.bloques.length > 200) return err('Demasiados bloques (maximo 200)')
    op.bloques = body.bloques
  }
  if (body.imagenes !== undefined) {
    if (!Array.isArray(body.imagenes)) return err('imagenes debe ser un arreglo')
    op.imagenes = body.imagenes.map((x: any) => String(x).slice(0, 1000)).filter(Boolean)
  }
  if (body.clasificacion !== undefined) {
    const clasificacion = String(body.clasificacion)
    if (!CLASIFICACIONES.has(clasificacion)) return err('Clasificacion invalida')
    op.clasificacion = clasificacion as any
  }
  if (body.unidad !== undefined) {
    const unidad = String(body.unidad).trim()
    if (!unidad || unidad.length > 100) return err('Unidad invalida (1-100 caracteres)')
    op.unidad = unidad
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return err('tags debe ser un arreglo')
    op.tags = body.tags.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 30)
  }
  if (body.accion !== undefined && !ACCIONES.has(String(body.accion))) {
    return err('Accion invalida')
  }
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
