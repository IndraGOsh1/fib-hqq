import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, forbidden } from '@/lib/auth'
import { getCarpeta } from '@/lib/carpeta-db'

export async function GET(req: NextRequest) {
  const u = getUser(req)
  if (!u) return unauthorized()

  const { searchParams } = new URL(req.url)
  const targetUsername = searchParams.get('username')

  // If requesting another user's carpeta, require supervisory or command_staff
  if (targetUsername && targetUsername !== u.username) {
    if (!['command_staff', 'supervisory'].includes(u.rol)) return forbidden()
    // Return the other user's carpeta (public anotaciones only for non-CS)
    const carpeta = await getCarpeta(targetUsername)
    if (u.rol !== 'command_staff') {
      // Filter out private notes for supervisory
      return NextResponse.json({
        ...carpeta,
        anotaciones: carpeta.anotaciones.filter((a: any) => !a.privada)
      })
    }
    return NextResponse.json(carpeta)
  }

  return NextResponse.json(await getCarpeta(u.username))
}

export async function POST(req: NextRequest) {
  const u = getUser(req)
  if (!u) return unauthorized()
  const carpeta = await getCarpeta(u.username)
  const body = await req.json().catch(()=>({}))
  const now  = new Date().toISOString()

  if (body.tipo === 'anotacion') {
    const { titulo, contenido, privada } = body
    if (!titulo?.trim() || !contenido?.trim()) return NextResponse.json({ error:'titulo y contenido requeridos' }, { status:400 })
    carpeta.anotaciones.push({ id:uuid().slice(0,8), titulo:titulo.trim(), contenido:contenido.trim(), fecha:now, privada:privada||false })
    return NextResponse.json({ mensaje:'✅ Anotación guardada' }, { status:201 })
  }

  if (body.tipo === 'documento') {
    const { nombre, descripcion } = body
    if (!nombre?.trim()) return NextResponse.json({ error:'nombre requerido' }, { status:400 })
    carpeta.documentos.push({ id:uuid().slice(0,8), nombre:nombre.trim(), descripcion:descripcion||'', fecha:now })
    return NextResponse.json({ mensaje:'✅ Documento registrado' }, { status:201 })
  }

  return NextResponse.json({ error:'tipo inválido' }, { status:400 })
}

export async function DELETE(req: NextRequest) {
  const u = getUser(req)
  if (!u) return unauthorized()
  const { tipo, id } = await req.json().catch(()=>({}))
  const carpeta = await getCarpeta(u.username)

  if (tipo === 'anotacion') carpeta.anotaciones = carpeta.anotaciones.filter((a: any) => a.id !== id)
  if (tipo === 'documento')  carpeta.documentos  = carpeta.documentos.filter((d: any) => d.id !== id)

  return NextResponse.json({ mensaje:'✅ Eliminado' })
}
