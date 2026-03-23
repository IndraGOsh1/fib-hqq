import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden, notFound } from '@/lib/auth'
import { ChatDB, type Mensaje } from '@/lib/chat-db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { canal: canalId } = await params
  const canal = ChatDB.canales.get(canalId); if (!canal) return notFound()
  if (canal.id === 'comando' && u.rol !== 'command_staff') return forbidden()
  if (canal.tipo === 'dm' && !canal.participantes?.includes(u.username)) return forbidden()
  const msgs = ChatDB.mensajes.get(canalId) || []
  return NextResponse.json(msgs.slice(-100))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ canal: string }> }) {
  const u = getUser(req); if (!u) return unauthorized()
  const { canal: canalId } = await params
  const canal = ChatDB.canales.get(canalId); if (!canal) return notFound()
  if (canal.id === 'comando' && u.rol !== 'command_staff') return forbidden()
  if (canal.tipo === 'dm' && !canal.participantes?.includes(u.username)) return forbidden()
  const { contenido } = await req.json().catch(()=>({}))
  if (!contenido?.trim()) return NextResponse.json({ error:'Mensaje vacío' }, { status:400 })
  const msg: Mensaje = {
    id: uuid().slice(0,12), canal: canalId,
    autor: u.username, nombre: u.nombre || u.username,
    contenido: contenido.trim(), fecha: new Date().toISOString(), tipo: 'texto',
  }
  if (!ChatDB.mensajes.has(canalId)) ChatDB.mensajes.set(canalId, [])
  ChatDB.mensajes.get(canalId)!.push(msg)
  return NextResponse.json(msg, { status:201 })
}
