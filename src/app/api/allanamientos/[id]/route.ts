import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound, err } from '@/lib/auth'
import { getAllanamientosDB, type Firma } from '@/lib/allanamientos-db'
import { getDB } from '@/lib/db'
import { logAllanamiento } from '@/lib/webhook'

type P = { params: Promise<{id:string}> }

export async function GET(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const db = await getAllanamientosDB()
  const a = db.get(id); if (!a) return notFound()
  if (u.rol==='federal_agent' && a.solicitadoPor!==u.username) return forbidden()
  return NextResponse.json(a)
}

export async function PATCH(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  const { id } = await params
  const [allDB, userDB] = await Promise.all([getAllanamientosDB(), getDB()])
  const a = allDB.get(id); if (!a) return notFound()
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()
  const isSuperv = ['command_staff','supervisory'].includes(u.rol)
  const userProfile = Array.from(userDB.users.values()).find(us => us.username === u.username)
  const accion = String(body.accion || '')

  if (body.mensaje) {
    const canMessage = isSuperv || (a.solicitadoPor === u.username && a.estado === 'pendiente')
    if (!canMessage) return forbidden()
    const contenido = String(body.mensaje).trim()
    if (!contenido || contenido.length > 2000) return err('Mensaje invalido (1-2000 caracteres)')
    a.mensajes.push({
      id: uuid().slice(0,8), autor:u.username, nombre:u.nombre||u.username,
      contenido, fecha:now, tipo:'mensaje'
    })
  }

  if (accion === 'autorizar' && isSuperv) {
    a.estado = 'autorizado'
    const firma: Firma = {
      username:u.username, nombre:u.nombre||u.username,
      callsign:userProfile?.callsign||null, rol:u.rol,
      fecha:now, tipo:'autorizacion'
    }
    a.firmas.push(firma)
    a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`✅ Autorizado por ${u.nombre||u.username} (${u.rol})`, fecha:now, tipo:'accion' })
    if (body.observaciones !== undefined) {
      const observaciones = String(body.observaciones).trim()
      if (observaciones.length > 1200) return err('Observaciones demasiado largas (maximo 1200)')
      a.observaciones = observaciones
    }
    logAllanamiento('Autorizado', a.numeroSolicitud, u.username)
  }

  if (accion === 'denegar' && isSuperv) {
    const motivo = String(body.motivo || '').trim()
    if (!motivo || motivo.length > 500) return err('Motivo invalido (1-500 caracteres)')
    a.estado = 'denegado'
    a.motivoDenegacion = motivo
    a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`❌ Denegado por ${u.nombre||u.username}: ${a.motivoDenegacion}`, fecha:now, tipo:'accion' })
    logAllanamiento('Denegado', a.numeroSolicitud ?? undefined, u.username, a.motivoDenegacion ?? undefined)
  }

  if (accion === 'ejecutar' && isSuperv) {
    a.estado = 'ejecutado'; a.fechaEjecucion = now
    a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`✅ Marcado como ejecutado por ${u.nombre||u.username}`, fecha:now, tipo:'accion' })
  }

  if (accion === 'firmar' && isSuperv) {
    const yaFirmo = a.firmas.some(f => f.username === u.username)
    if (!yaFirmo) {
      const tipoFirmaRaw = String(body.tipoFirma || 'supervisor')
      const tipoFirma = ['autorizacion', 'fiscal', 'supervisor'].includes(tipoFirmaRaw) ? tipoFirmaRaw : 'supervisor'
      a.firmas.push({ username:u.username, nombre:u.nombre||u.username,
        callsign:userProfile?.callsign||null, rol:u.rol, fecha:now, tipo:tipoFirma as any })
      a.mensajes.push({ id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
        contenido:`✍️ Firmado por ${u.nombre||u.username}`, fecha:now, tipo:'accion' })
    }
  }

  if (accion === 'generar_pdf') {
    const canGenerate = isSuperv || a.solicitadoPor === u.username
    if (!canGenerate) return forbidden()
    a.mensajes.push({
      id: uuid().slice(0,8),
      autor: 'SYSTEM',
      nombre: 'Sistema',
      contenido: `📄 Documento generado por ${u.nombre || u.username}`,
      fecha: now,
      tipo: 'documento',
    })
  }

  if (accion && !['autorizar', 'denegar', 'ejecutar', 'firmar', 'generar_pdf'].includes(accion)) {
    return err('Accion invalida')
  }

  a.actualizadoEn = now
  allDB.set(id, a)
  return NextResponse.json({ mensaje:'✅ Actualizado', estado:a.estado })
}

export async function DELETE(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()
  const { id } = await params
  const db = await getAllanamientosDB()
  if (!db.has(id)) return notFound()
  db.delete(id)
  return NextResponse.json({ mensaje:'✅ Eliminado' })
}
