import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getUser, unauthorized, err } from '@/lib/auth'
import { AllanamientosDB, nextAllNumber, type Allanamiento } from '@/lib/allanamientos-db'
import { DB } from '@/lib/db'
import { logAllanamiento } from '@/lib/webhook'

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
  const userProfile = Array.from(DB.users.values()).find(us => us.username === u.username)
  const now = new Date().toISOString()
  const all: Allanamiento = {
    id: 'all-' + uuid().slice(0,8),
    numeroSolicitud: nextAllNumber(),
    direccion:direccion.trim(), motivacion:motivacion.trim(),
    descripcion:descripcion?.trim()||'',
    sospechoso:sospechoso||'Sin identificar',
    casoVinculado:casoVinculado||null,
    estado:'pendiente',
    solicitadoPor:u.username, nombreSolicitante:u.nombre||u.username,
    callsignSolicitante: userProfile?.callsign||null,
    unidad:unidad||'General',
    fechaSolicitud:now, firmas:[],
    motivoDenegacion:null, observaciones:'',
    mensajes:[{
      id:uuid().slice(0,8), autor:'SYSTEM', nombre:'Sistema',
      contenido:`Solicitud ${nextAllNumber()} creada por ${u.nombre||u.username}`,
      fecha:now, tipo:'sistema'
    }],
    actualizadoEn:now,
  }
  // Fix: use same number
  all.mensajes[0].contenido = `Solicitud ${all.numeroSolicitud} creada por ${u.nombre||u.username}`
  AllanamientosDB.set(all.id, all)
  logAllanamiento('Creada', all.numeroSolicitud, u.username, direccion)
  return NextResponse.json({ mensaje:'✅ Solicitud enviada', id:all.id, numero:all.numeroSolicitud }, { status:201 })
}
