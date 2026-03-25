import { NextRequest } from 'next/server'
import { getAllanamientosDB } from '@/lib/allanamientos-db'

const XML_HEADERS = {
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=300',
}

function escapeXml(input: string) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function statusLabel(raw: string) {
  if (raw === 'autorizado') return 'AUTORIZADO'
  if (raw === 'denegado') return 'DENEGADO'
  if (raw === 'ejecutado') return 'EJECUTADO'
  return 'PENDIENTE'
}

function statusColor(raw: string) {
  if (raw === 'autorizado') return '#22c55e'
  if (raw === 'denegado') return '#ef4444'
  if (raw === 'ejecutado') return '#3b82f6'
  return '#eab308'
}

type P = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: P) {
  const { id } = await params
  const db = await getAllanamientosDB()
  const item = db.get(id)

  if (!item) {
    const notFoundSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">
  <rect width="1200" height="628" fill="#0b1220"/>
  <text x="600" y="300" text-anchor="middle" fill="#d1d5db" font-size="40" font-family="Arial, sans-serif">No encontrado</text>
</svg>`
    return new Response(notFoundSvg, { status: 404, headers: XML_HEADERS })
  }

  const estado = statusLabel(item.estado)
  const estadoColor = statusColor(item.estado)
  const fecha = new Date(item.fechaSolicitud).toLocaleDateString('es')
  const solicitante = `${item.nombreSolicitante}${item.callsignSolicitante ? ` [${item.callsignSolicitante}]` : ''}`

  const lines = [
    `Dirección: ${item.direccion}`,
    `Sospechoso(s): ${item.sospechoso || 'Sin identificar'}`,
    item.descripcion ? `Descripción: ${item.descripcion}` : '',
  ].filter(Boolean)

  const blocks = lines
    .slice(0, 3)
    .map((line, idx) => `<text x="90" y="${250 + idx * 45}" fill="#0f172a" font-size="34" font-family="Georgia, serif">${escapeXml(line)}</text>`)
    .join('')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">
  <rect width="1200" height="628" fill="#f5f0e8"/>
  <rect x="75" y="70" width="1050" height="6" fill="#111827"/>
  <rect x="75" y="77" width="1050" height="3" fill="#c9a227"/>

  <text x="90" y="130" fill="#a16207" font-size="17" letter-spacing="3" font-family="monospace">Federal Investigation Bureau - HQ</text>
  <text x="90" y="175" fill="#111827" font-size="58" font-weight="700" letter-spacing="2" font-family="Arial, sans-serif">SOLICITUD DE ALLANAMIENTO</text>
  <text x="90" y="205" fill="#334155" font-size="16" letter-spacing="6" font-family="monospace">REPORTE OPERATIVO CLASIFICADO</text>

  <text x="965" y="122" text-anchor="end" fill="#475569" font-size="13" letter-spacing="2" font-family="monospace">N° SOLICITUD</text>
  <text x="965" y="158" text-anchor="end" fill="#0f172a" font-size="46" font-weight="700" font-family="Arial, sans-serif">${escapeXml(item.numeroSolicitud)}</text>
  <text x="965" y="188" text-anchor="end" fill="#475569" font-size="16" font-family="monospace">${escapeXml(fecha)}</text>
  <text x="965" y="215" text-anchor="end" fill="${estadoColor}" font-size="16" font-family="monospace">${escapeXml(estado)}</text>

  <rect x="90" y="225" width="1020" height="260" fill="#ffffff" stroke="#e2d9c3"/>
  ${blocks}

  <rect x="90" y="505" width="500" height="95" fill="none" stroke="#c9a227"/>
  <rect x="610" y="505" width="500" height="95" fill="none" stroke="#c9a227"/>
  <text x="110" y="535" fill="#a16207" font-size="12" letter-spacing="2" font-family="monospace">SOLICITANTE</text>
  <text x="110" y="575" fill="#0f172a" font-size="25" font-family="Arial, sans-serif">${escapeXml(solicitante)}</text>
  <text x="630" y="535" fill="#a16207" font-size="12" letter-spacing="2" font-family="monospace">AUTORIZACIÓN OFICIAL</text>
  <text x="630" y="575" fill="#0f172a" font-size="25" font-family="Arial, sans-serif">${escapeXml(item.firmas?.[0]?.nombre || 'Pendiente')}</text>

  <text x="600" y="450" text-anchor="middle" fill="rgba(34,197,94,0.12)" font-size="88" font-weight="700" letter-spacing="5" transform="rotate(-28, 600, 450)" font-family="Arial, sans-serif">${escapeXml(estado)}</text>
</svg>`

  return new Response(svg, { status: 200, headers: XML_HEADERS })
}
