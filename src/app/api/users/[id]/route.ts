import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { deleteUserById, getDB, persistUser, type Rol } from '@/lib/db'
import { logKeyAction, logRegistroImportante } from '@/lib/webhook'

const ROLES: Rol[] = ['command_staff', 'supervisory', 'federal_agent', 'visitante']
const VALID_CLASSES = ['RRHH', 'CIRG', 'Task Force', 'UO', 'General']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id:string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  if (!['command_staff','supervisory'].includes(u.rol)) return forbidden()
  const { id } = await params
  const db = await getDB()
  const usr = db.users.get(id); if (!usr) return notFound('Usuario no encontrado')
  if (u.rol === 'supervisory' && usr.rol === 'command_staff') return forbidden()
  const { rol, activo, discordId, agentNumber, nombre, callsign, vetado, vetoReason, clases } = await req.json().catch(()=>({}))

  if (u.rol === 'command_staff') {
    if (rol !== undefined) {
      if (!ROLES.includes(rol)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      usr.rol = rol
    }
    if (typeof activo === 'boolean') usr.activo = activo
    if (discordId !== undefined) usr.discordId = discordId
    if (agentNumber !== undefined) usr.agentNumber = agentNumber
    if (nombre !== undefined) usr.nombre = nombre
    if (clases !== undefined) {
      if (!Array.isArray(clases)) return NextResponse.json({ error: 'Clases inválidas' }, { status: 400 })
      usr.clases = clases
        .map((x: any) => String(x || '').trim())
        .filter((x: string) => VALID_CLASSES.includes(x))
        .slice(0, 6)
    }
  }

  if (u.rol === 'supervisory') {
    if (rol !== undefined || activo !== undefined || discordId !== undefined || agentNumber !== undefined || nombre !== undefined || vetado !== undefined || vetoReason !== undefined || clases !== undefined) {
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
  try {
    await persistUser(usr)
  } catch {
    return NextResponse.json({ error: 'No se pudo persistir el usuario en base de datos. Reintenta.' }, { status: 503 })
  }
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

  const backup = db.users.get(id)
  db.users.delete(id)
  try {
    await deleteUserById(id)
  } catch {
    if (backup) db.users.set(id, backup)
    return NextResponse.json({ error: 'No se pudo eliminar el usuario en base de datos. Reintenta.' }, { status: 503 })
  }
  return NextResponse.json({ mensaje: '✅ Usuario eliminado' })
}
