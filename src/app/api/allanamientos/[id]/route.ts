import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { AllanamientosDB, type Firma } from '@/lib/allanamientos-db'
import { DB } from '@/lib/db'
import { logAllanamiento } from '@/lib/webhook'

type P = { params: Promise<{id:string}> }

export async function GET(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const a = AllanamientosDB.get(id); if (!a) return notFound()
  if (u.rol==='federal_agent' && a.solicitadoPor!==u.username) return forbidden()
  return NextResponse.json(a)
}

export async function PATCH(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const a = AllanamientosDB.get(id); if (!a) return notFound()
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()
  const isSuperv = ['command_staff','supervisory'].includes(u.rol)
  const userProfile = Array.from(DB.users.values()).find(us => us.username === u.username)

  // Send message — solicitante can only send if they haven't yet, others always
  if (body.mensaje) {
    const canMessage = isSuperv || (a.solicitadoPor === u.username && a.estado === 'pendiente')
    if (!canMessage) return forbidden()
    a.mensajes.push({
      id: uuid().slice(0,8), autor:u.username, nombre:u.nombre||u.username,
      contenido: body.mensaje, fecha:now, tipo:'mensaje'
    })
  }

  // Autorizar
  if (body.accion === 'autorizar' && isSuperv) {
    a.estado = 'autorizado'
    const firma: Firma = {
      username:u.username, nombre:u.nombre||u.username,
      callsign:userProfile?.callsign||null, rol:u.rol,
      fecha:now, tipo:'autorizacion'
    }
    a.firmas.push(firma)
    a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`✅ Autorizado por ${u.nombre||u.username} (${u.rol})`, fecha:now, tipo:'accion' })
    if (body.observaciones) a.observaciones = body.observaciones
    logAllanamiento('Autorizado', a.numeroSolicitud, u.username)
  }

  // Denegar
  if (body.accion === 'denegar' && isSuperv) {
    a.estado = 'denegado'
    a.motivoDenegacion = body.motivo || 'Sin motivo'
    a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`❌ Denegado por ${u.nombre||u.username}: ${a.motivoDenegacion}`, fecha:now, tipo:'accion' })
    logAllanamiento('Denegado', a.numeroSolicitud ?? undefined, u.username, a.motivoDenegacion ?? undefined)
  }

  // Ejecutar
  if (body.accion === 'ejecutar' && isSuperv) {
    a.estado = 'ejecutado'; a.fechaEjecucion = now
    a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`✅ Marcado como ejecutado por ${u.nombre||u.username}`, fecha:now, tipo:'accion' })
  }

  // Agregar firma adicional
  if (body.accion === 'firmar' && isSuperv) {
    const yaFirmo = a.firmas.some(f => f.username === u.username)
    if (!yaFirmo) {
      a.firmas.push({ username:u.username, nombre:u.nombre||u.username,
        callsign:userProfile?.callsign||null, rol:u.rol, fecha:now, tipo:body.tipoFirma||'supervisor' })
      a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
        contenido:`✍️ Firmado por ${u.nombre||u.username}`, fecha:now, tipo:'accion' })
    }
  }

  a.actualizadoEn = now
  AllanamientosDB.set(id, a)
  return NextResponse.json({ mensaje:'✅ Actualizado', estado:a.estado })
}

export async function DELETE(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { id } = await params
  if (!AllanamientosDB.has(id)) return notFound()
  AllanamientosDB.delete(id)
  return NextResponse.json({ mensaje:'✅ Eliminado' })
}
