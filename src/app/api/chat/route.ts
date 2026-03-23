import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized } from '@/lib/auth'
import { ChatDB } from '@/lib/chat-db'

// GET /api/chat — lista de canales
export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const canales = Array.from(ChatDB.canales.values()).filter(c => {
    if (c.tipo === 'dm') return c.participantes?.includes(u.username)
    if (c.id === 'comando' && u.rol !== 'command_staff') return false
    return true
  })
  return NextResponse.json(canales)
}

// POST /api/chat — crear DM o canal nuevo (solo CS)
export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const { tipo, nombre, descripcion, unidad, participantes } = await req.json().catch(()=>({}))

  const now = new Date().toISOString()
  if (tipo === 'dm' && participantes?.length === 2) {
    const dmId = `dm-${participantes.sort().join('-')}`
    if (!ChatDB.canales.has(dmId)) {
      ChatDB.canales.set(dmId, { id:dmId, nombre:dmId, descripcion:'Mensaje directo', tipo:'dm', participantes, creadoEn:now })
      ChatDB.mensajes.set(dmId, [])
    }
    return NextResponse.json({ id:dmId })
  }

  if (u.rol !== 'command_staff') return NextResponse.json({ error:'Sin permisos' }, { status:403 })
  const id = nombre?.toLowerCase().replace(/\s+/g,'-') || uuid().slice(0,8)
  ChatDB.canales.set(id, { id, nombre:nombre||id, descripcion:descripcion||'', tipo:tipo||'general', unidad, creadoEn:now })
  ChatDB.mensajes.set(id, [])
  return NextResponse.json({ id }, { status:201 })
}
