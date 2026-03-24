import { v4 as uuid } from 'uuid'
import { SupabaseMap } from './supabase-map'

export type FormFieldType = 'text' | 'textarea' | 'number' | 'date'

export interface FormField {
  id: string
  label: string
  type: FormFieldType
  required: boolean
}

export interface FormDefinition {
  id: string
  title: string
  description: string
  active: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  fields: FormField[]
}

export interface FormSubmission {
  id: string
  formId: string
  byUser: string
  byRole: string
  createdAt: string
  answers: Record<string, string>
  ip: string
  userAgent: string
}

type FormsStore = {
  forms: Map<string, FormDefinition>
  submissions: Map<string, FormSubmission>
}

declare global {
  // eslint-disable-next-line no-var
  var __fibFormsDB: FormsStore | undefined
  var __fibFormsInit: Promise<FormsStore> | undefined
}

const isSupabaseEnabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)

function defaultForms(): FormDefinition[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'frm-reporte-interno',
      title: 'Reporte Interno',
      description: 'Formulario para reportes operativos y administrativos.',
      active: true,
      createdBy: 'SYSTEM',
      createdAt: now,
      updatedAt: now,
      fields: [
        { id: 'asunto', label: 'Asunto', type: 'text', required: true },
        { id: 'detalle', label: 'Detalle', type: 'textarea', required: true },
        { id: 'fecha_evento', label: 'Fecha del evento', type: 'date', required: false },
      ],
    },
  ]
}

async function initFormsDB(): Promise<FormsStore> {
  if (isSupabaseEnabled) {
    const [forms, submissions] = await Promise.all([
      SupabaseMap.create<'id', FormDefinition>('forms', 'id', defaultForms()),
      SupabaseMap.create<'id', FormSubmission>('form_submissions', 'id'),
    ])
    return { forms, submissions }
  }

  if (!global.__fibFormsDB) {
    const forms = new Map<string, FormDefinition>()
    defaultForms().forEach(f => forms.set(f.id, f))
    global.__fibFormsDB = { forms, submissions: new Map<string, FormSubmission>() }
  }
  return global.__fibFormsDB
}

if (!global.__fibFormsInit) {
  global.__fibFormsInit = initFormsDB().then(db => {
    global.__fibFormsDB = db
    return db
  })
}

export async function getFormsDB(): Promise<FormsStore> {
  return global.__fibFormsInit as Promise<FormsStore>
}

export function buildFormId() {
  return `frm-${uuid().slice(0, 8)}`
}

export function buildSubmissionId() {
  return `fs-${uuid().slice(0, 10)}`
}
