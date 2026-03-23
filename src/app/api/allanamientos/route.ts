import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, err } from '@/lib/auth'
import { AllanamientosDB, nextAllNumber, type Allanamiento } from '@/lib/allanamientos-db'

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  let lista = Array.from(AllanamientosDB.values())
  if (u.rol === 'federal_agent') lista = lista.filter(a => a.solicitadoPor === u.username)
  if (estado) lista = lista.filter(a => a.estado === estado)
  lista.sort((a,b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())
  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const { direccion, motivacion, descripcion, sospechoso, casoVinculado, unidad } = await req.json().catch(()=>({}))
  if (!direccion?.trim() || !motivacion?.trim()) return err('direccion y motivacion son requeridos')

  const now = new Date().toISOString()
  const all: Allanamiento = {
    id: `all-${uuid().slice(0,8)}`,
    numeroSolicitud: nextAllNumber(),
    direccion: direccion.trim(), motivacion: motivacion.trim(),
    descripcion: descripcion?.trim()||'',
    sospechoso: sospechoso||'Sin identificar',
    casoVinculado: casoVinculado||null,
    estado: 'pendiente',
    solicitadoPor: u.username, nombreSolicitante: u.nombre||u.username,
    unidad: unidad||'General',
    fechaSolicitud: now,
    autorizadoPor:null, autorizadoEn:null, motivoDenegacion:null,
    observaciones:'', pdfGenerado:false, actualizadoEn:now,
  }
  AllanamientosDB.set(all.id, all)
  return NextResponse.json({ mensaje:'✅ Solicitud enviada', id:all.id, numero:all.numeroSolicitud }, { status:201 })
}
