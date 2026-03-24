import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden } from '@/lib/auth'
import { getChatDB, canAccess, getOrCreateDM, countUnreadDMs } from '@/lib/chat-db'

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const chat = await getChatDB()
  const canales = Array.from(chat.canales.values())
    .filter(c => canAccess(c, u.rol, u.username))
    .map(c => ({
      ...c,
      lastMessage: (chat.mensajes.get(c.id)||[]).slice(-1)[0] || null,
      unread: c.tipo === 'dm'
        ? (chat.mensajes.get(c.id)||[]).filter(m => m.autor !== u.username && !m.leido.includes(u.username)).length
        : 0
    }))
  const totalDMUnread = countUnreadDMs(u.username)
  return NextResponse.json({ canales, totalDMUnread })
}

export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const { tipo, targetUsername } = await req.json().catch(()=>({}))
  if (tipo === 'dm' && targetUsername) {
    const canal = getOrCreateDM(u.username, targetUsername)
    return NextResponse.json({ id:canal.id })
  }
  return forbidden()
}
