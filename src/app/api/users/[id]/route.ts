import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { getDB, type Rol } from '@/lib/db'
import { logKeyAction, logRegistroImportante } from '@/lib/webhook'

const ROLES: Rol[] = ['command_staff', 'supervisory', 'federal_agent', 'visitante']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id:string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  const { id } = await params
  const db = await getDB()
  const usr = db.users.get(id); if (!usr) return notFound('Usuario no encontrado')
  if (u.rol === 'supervisory' && usr.rol === 'command_staff') return forbidden()
  const { rol, activo, discordId, agentNumber, nombre, callsign, vetado, vetoReason } = await req.json().catch(()=>({}))

  if (u.rol === 'command_staff') {
    if (rol !== undefined) {
      if (!ROLES.includes(rol)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      usr.rol = rol
    }
    if (typeof activo === 'boolean') usr.activo = activo
    if (discordId !== undefined) usr.discordId = discordId
    if (agentNumber !== undefined) usr.agentNumber = agentNumber
    if (nombre !== undefined) usr.nombre = nombre
  }

  if (u.rol === 'supervisory') {
    if (rol !== undefined || activo !== undefined || discordId !== undefined || agentNumber !== undefined || nombre !== undefined || vetado !== undefined || vetoReason !== undefined) {
      return forbidden()
    }
  }

  if (u.rol === 'command_staff' && typeof vetado === 'boolean') {
    usr.vetado = vetado
    usr.vetoReason = vetado ? (String(vetoReason || '').trim() || 'Sin motivo especificado') : null
    usr.vetoAt = vetado ? new Date().toISOString() : null
    usr.vetoBy = vetado ? u.username : null
    logRegistroImportante('Veto', usr.username, u.username, vetado ? `Vetado. Motivo: ${usr.vetoReason}` : 'Veto retirado')
  }

  if (callsign   !== undefined) {
    usr.callsign = callsign
    logKeyAction('Callsign asignado', u.username, `${usr.username} → ${callsign}`)
  }
  db.users.set(id, usr)
  const { passwordHash:_, ...safe } = usr
  return NextResponse.json({ mensaje:'✅ Usuario actualizado', usuario:safe })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id:string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()

  const { id } = await params
  const db = await getDB()
  const usr = db.users.get(id); if (!usr) return notFound('Usuario no encontrado')

  if (usr.id === u.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
  }

  db.users.delete(id)
  return NextResponse.json({ mensaje: '✅ Usuario eliminado' })
}
