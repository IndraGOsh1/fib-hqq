import { NextRequest, NextResponse } from 'next/server'
import { getUser, unauthorized, forbidden, err } from '@/lib/auth'
import { getFormsDB } from '@/lib/forms-db'

type P = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: P) {
  const u = getUser(req); if (!u) return unauthorized()
  if (u.rol !== 'command_staff') return forbidden()

  const { id } = await params
  const db = await getFormsDB()
  const form = db.forms.get(id)
  if (!form) return err('Formulario no encontrado', 404)

  const responses = Array.from(db.submissions.values())
    .filter(s => s.formId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ form, responses })
}
