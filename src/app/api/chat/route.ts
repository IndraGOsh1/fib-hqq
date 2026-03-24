import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden } from '@/lib/auth'
import { getChatDB, canAccess, getOrCreateDM, countUnreadDMs, getLastMessage, getUnreadCount } from '@/lib/chat-db'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const chat = await getChatDB()
  const allowed = Array.from(chat.canales.values()).filter(c => canAccess(c, u.rol, u.username))

  const canales = await Promise.all(
    allowed.map(async c => ({
      ...c,
      lastMessage: await getLastMessage(c.id),
      unread: await getUnreadCount(c.id, u.username),
    }))
  )

  const totalDMUnread = await countUnreadDMs(u.username)
  const totalUnread = canales.reduce((acc, c) => acc + (c.unread || 0), 0)
  return NextResponse.json({ canales, totalDMUnread, totalUnread })
}

export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const { tipo, targetUsername } = await req.json().catch(()=>({}))
  if (tipo === 'dm' && targetUsername) {
    const target = String(targetUsername).trim()
    if (!target) return NextResponse.json({ error:'Usuario destino inválido' }, { status:400 })
    if (target.toLowerCase() === u.username.toLowerCase()) {
      return NextResponse.json({ error:'No puedes abrir un DM contigo mismo' }, { status:400 })
    }

    const db = await getDB()
    const exists = Array.from(db.users.values()).some(us => us.username.toLowerCase() === target.toLowerCase())
    if (!exists) return NextResponse.json({ error:'Usuario no encontrado' }, { status:404 })

    const realUsername = Array.from(db.users.values()).find(us => us.username.toLowerCase() === target.toLowerCase())!.username
    const canal = getOrCreateDM(u.username, realUsername)
    return NextResponse.json({ id:canal.id })
  }
  return forbidden()
}
