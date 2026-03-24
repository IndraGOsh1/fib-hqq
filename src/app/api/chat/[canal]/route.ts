import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { getChatDB, canAccess, markRead, type Mensaje } from '@/lib/chat-db'
import { getDB } from '@/lib/db'

type P = { params: Promise<{ canal:string }> }

export async function GET(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  const { canal:canalId } = await params
  const chat = await getChatDB()
  const canal = chat.canales.get(canalId); if (!canal) return notFound()
  if (!canAccess(canal, u.rol, u.username)) return forbidden()
  markRead(canalId, u.username)
  const msgs = (chat.mensajes.get(canalId)||[]).slice(-100)
  return NextResponse.json(msgs)
}

export async function POST(req: NextRequest, { params }:P) {
  const u = getUser(req); if (!u) return unauthorized()
  const { canal:canalId } = await params
  const [chat, userDB] = await Promise.all([getChatDB(), getDB()])
  const canal = chat.canales.get(canalId); if (!canal) return notFound()
  if (!canAccess(canal, u.rol, u.username)) return forbidden()
  const { contenido } = await req.json().catch(()=>({}))
  if (!contenido?.trim()) return NextResponse.json({ error:'Vacío' }, { status:400 })

  const userProfile = Array.from(userDB.users.values()).find(us => us.username === u.username)
  const callsign = userProfile?.callsign || null

  const isImg = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(contenido.trim())
  const msg: Mensaje = {
    id:       uuid().slice(0,12),
    canal:    canalId,
    autor:    u.username,
    nombre:   u.nombre || u.username,
    callsign: callsign || undefined,
    contenido:contenido.trim(),
    fecha:    new Date().toISOString(),
    tipo:     isImg ? 'imagen' : 'texto',
    leido:    [u.username],
  }
  if (!chat.mensajes.has(canalId)) chat.mensajes.set(canalId, [])
  chat.mensajes.get(canalId)!.push(msg)
  // Keep max 500 messages per channel in memory
  const msgs = chat.mensajes.get(canalId)!
  if (msgs.length > 500) msgs.splice(0, msgs.length - 500)
  return NextResponse.json(msg, { status:201 })
}
