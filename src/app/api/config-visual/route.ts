import { NextRequest, NextResponse } from 'next/server'
import { getUser, forbidden } from '@/lib/auth'
import { ConfigVisualDB } from '@/lib/config-visual-db'

function sanitizeOposicionesInfo(raw: any) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const rawGoogle = String(source.googleFormId || '').trim()
  const extractedFromUrl = rawGoogle.match(/\/d\/e\/([a-zA-Z0-9_-]+)/)?.[1] || ''
  const normalizedGoogleFormId = (extractedFromUrl || rawGoogle).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200)
  const datos = Array.isArray(source.datos)
    ? source.datos.map((x: any) => String(x || '').trim().slice(0, 240)).filter(Boolean).slice(0, 12)
    : []
  const imagenes = Array.isArray(source.imagenes)
    ? source.imagenes.map((x: any) => String(x || '').trim().slice(0, 2000)).filter(Boolean).slice(0, 10)
    : []

  return {
    titulo: String(source.titulo || 'Oposiciones').trim().slice(0, 120),
    descripcion: String(source.descripcion || '').trim().slice(0, 3000),
    datos,
    imagenes,
    googleFormId: normalizedGoogleFormId,
  }
}

function clampNumber(v: any, min: number, max: number, fallback: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function sanitizeWebsiteSettings(raw: any) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const fit = source.heroImageFit === 'contain' ? 'contain' : 'cover'
  return {
    enableAnimations: source.enableAnimations !== false,
    heroLogoSize: clampNumber(source.heroLogoSize, 72, 260, 130),
    heroImageOpacity: clampNumber(source.heroImageOpacity, 0, 100, 20),
    heroGridOpacity: clampNumber(source.heroGridOpacity, 0, 100, 20),
    heroImageFit: fit,
    heroImagePosition: String(source.heroImagePosition || 'center').trim().slice(0, 40),
    pageMaxWidth: clampNumber(source.pageMaxWidth, 90, 180, 112),
    sectionGap: clampNumber(source.sectionGap, 12, 56, 28),
    cardRadius: clampNumber(source.cardRadius, 0, 24, 0),
    cardBlur: clampNumber(source.cardBlur, 0, 20, 0),
    missionImageHeight: clampNumber(source.missionImageHeight, 200, 720, 400),
    oposicionesImageHeight: clampNumber(source.oposicionesImageHeight, 80, 340, 112),
  }
}

export async function GET() {
  return NextResponse.json(ConfigVisualDB.get())
}

export async function PATCH(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  const body = await req.json().catch(() => ({}))

  const next: Record<string, unknown> = { ...body }
  const isIndra = String(u.username || '').toLowerCase() === 'indra'

  if (!isIndra) {
    delete next.textoMision
    delete next.descripcionDivision
    delete next.oposicionesInfo
  }

  if (next.oposicionesInfo !== undefined) {
    next.oposicionesInfo = sanitizeOposicionesInfo(next.oposicionesInfo)
  }

  if (next.websiteSettings !== undefined) {
    next.websiteSettings = sanitizeWebsiteSettings(next.websiteSettings)
  }

  await ConfigVisualDB.set({ ...next, actualizadoPor: u.username, actualizadoEn: new Date().toISOString() })
  return NextResponse.json({ mensaje:'✅ Configuración guardada', config:ConfigVisualDB.get() })
}

export async function DELETE(req: NextRequest) {
  const u = getUser(req)
  if (!u || u.rol !== 'command_staff') return forbidden()
  await ConfigVisualDB.reset()
  return NextResponse.json({ mensaje:'✅ Restablecido' })
}
