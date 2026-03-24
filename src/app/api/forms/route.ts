import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, err } from '@/lib/auth'
import { buildFormId, getFormsDB, type FormDefinition, type FormField } from '@/lib/forms-db'

function sanitizeFields(fields: any[]): FormField[] {
  return (Array.isArray(fields) ? fields : [])
    .map((f: any, idx: number) => ({
      id: String(f?.id || `f_${idx + 1}`).trim(),
      label: String(f?.label || '').trim(),
      type: ['text', 'textarea', 'number', 'date'].includes(f?.type) ? f.type : 'text',
      required: !!f?.required,
    }))
    .filter((f: FormField) => f.id && f.label)
}

export async function GET(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  const db = await getFormsDB()
  const forms = Array.from(db.forms.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const visible = u.rol === 'command_staff' ? forms : forms.filter(f => f.active)

  return NextResponse.json({
    forms: visible,
    canManage: u.rol === 'command_staff',
  })
}

export async function POST(req: NextRequest) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action || '').trim()
  const db = await getFormsDB()

  if (action === 'create') {
    const title = String(body?.form?.title || '').trim()
    if (!title) return err('Título requerido')

    const now = new Date().toISOString()
    const form: FormDefinition = {
      id: buildFormId(),
      title,
      description: String(body?.form?.description || '').trim(),
      active: body?.form?.active !== false,
      createdBy: u.username,
      createdAt: now,
      updatedAt: now,
      fields: sanitizeFields(body?.form?.fields || []),
    }

    if (form.fields.length === 0) return err('Debes agregar al menos un campo')
    db.forms.set(form.id, form)
    return NextResponse.json({ mensaje: '✅ Formulario creado', form })
  }

  if (action === 'update') {
    const id = String(body?.form?.id || '').trim()
    if (!id) return err('ID de formulario requerido')
    const current = db.forms.get(id)
    if (!current) return err('Formulario no encontrado', 404)

    const next: FormDefinition = {
      ...current,
      title: String(body?.form?.title || current.title).trim(),
      description: String(body?.form?.description || '').trim(),
      active: body?.form?.active !== false,
      updatedAt: new Date().toISOString(),
      fields: sanitizeFields(body?.form?.fields || current.fields),
    }
    if (!next.title) return err('Título requerido')
    if (next.fields.length === 0) return err('Debes agregar al menos un campo')

    db.forms.set(id, next)
    return NextResponse.json({ mensaje: '✅ Formulario actualizado', form: next })
  }

  if (action === 'toggle') {
    const id = String(body?.id || '').trim()
    const current = db.forms.get(id)
    if (!current) return err('Formulario no encontrado', 404)
    const next = { ...current, active: !current.active, updatedAt: new Date().toISOString() }
    db.forms.set(id, next)
    return NextResponse.json({ mensaje: '✅ Estado actualizado', form: next })
  }

  if (action === 'delete') {
    const id = String(body?.id || '').trim()
    if (!db.forms.has(id)) return err('Formulario no encontrado', 404)
    db.forms.delete(id)
    return NextResponse.json({ mensaje: '✅ Formulario eliminado' })
  }

  return err('Acción inválida')
}
