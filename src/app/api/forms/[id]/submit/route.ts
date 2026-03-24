import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, err } from '@/lib/auth'
import { buildSubmissionId, getFormsDB } from '@/lib/forms-db'
import { getRequestIp, rateLimit } from '@/lib/security'

type P = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: P) {
  const u = getUser(req); if (!u) return unauthorized()

  const ip = getRequestIp(req)
  const limit = rateLimit({ key: `forms:submit:${u.username}:${ip}`, max: 8, windowMs: 60_000 })
  if (!limit.ok) return err(`Demasiados envíos. Reintenta en ${limit.retryAfterSec}s`, 429)

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Simple anti-bot checks: hidden honeypot + minimal fill time.
  if (String(body?.hp || '').trim()) return err('Validación antibot fallida', 400)
  const startedAt = Number(body?.startedAt || 0)
  if (!startedAt || Date.now() - startedAt < 2000) return err('Validación antibot fallida', 400)

  const answers = body?.answers || {}
  const db = await getFormsDB()
  const form = db.forms.get(id)
  if (!form || !form.active) return err('Formulario no disponible', 404)

  const cleaned: Record<string, string> = {}
  for (const field of form.fields) {
    const raw = answers[field.id]
    const value = String(raw ?? '').trim()
    if (field.required && !value) return err(`Campo requerido: ${field.label}`)
    if (value.length > 5000) return err(`Campo demasiado largo: ${field.label}`)
    cleaned[field.id] = value
  }

  const submission = {
    id: buildSubmissionId(),
    formId: form.id,
    byUser: u.username,
    byRole: u.rol,
    createdAt: new Date().toISOString(),
    answers: cleaned,
    ip,
    userAgent: req.headers.get('user-agent') || 'unknown',
  }

  db.submissions.set(submission.id, submission)
  return NextResponse.json({ mensaje: '✅ Formulario enviado' }, { status: 201 })
}
