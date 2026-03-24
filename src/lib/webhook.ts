// Discord Webhook Logger
// Sends structured embeds to different webhook channels
import { getSecret } from './secrets'

const WEBHOOKS = {
  extras:    getSecret('DISCORD_WEBHOOK_EXTRAS'),
  keys:      getSecret('DISCORD_WEBHOOK_KEYS'),
  logins:    getSecret('DISCORD_WEBHOOK_LOGINS'),
  important: getSecret('DISCORD_WEBHOOK_IMPORTANTE') || getSecret('DISCORD_WEBHOOK_IMPORTANT'),
}

type WebhookType = keyof typeof WEBHOOKS
type Color = number

const COLORS = {
  green:  0x2ECC71,
  red:    0xE74C3C,
  blue:   0x3498DB,
  yellow: 0xF1C40F,
  gray:   0x95A5A6,
  purple: 0x9B59B6,
  orange: 0xE67E22,
  cyan:   0x1ABC9C,
}

interface EmbedField { name: string; value: string; inline?: boolean }

interface WebhookPayload {
  type:    WebhookType
  title:   string
  color?:  Color
  fields?: EmbedField[]
  description?: string
  footer?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __fibWebhookMissingWarned: Record<string, boolean> | undefined
}

export async function logWebhook(payload: WebhookPayload) {
  if (!global.__fibWebhookMissingWarned) global.__fibWebhookMissingWarned = {}
  const url = WEBHOOKS[payload.type]
  if (!url) {
    if (!global.__fibWebhookMissingWarned[payload.type]) {
      console.warn(`[webhook] Missing env for channel: ${payload.type}`)
      global.__fibWebhookMissingWarned[payload.type] = true
    }
    return
  }

  const embed = {
    title:       payload.title,
    color:       payload.color ?? COLORS.blue,
    description: payload.description,
    fields:      payload.fields || [],
    timestamp:   new Date().toISOString(),
    footer:      { text: payload.footer || 'FIB HQ System' },
  }

  try {
    await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ embeds: [embed] }),
    })
  } catch {}
}

// Helpers
export const logLogin = (username: string, rol: string, ip?: string) =>
  logWebhook({
    type:  'logins',
    title: '🔐 Inicio de Sesión',
    color: COLORS.green,
    fields: [
      { name: 'Usuario', value: username,   inline: true },
      { name: 'Rol',     value: rol,        inline: true },
      { name: 'IP',      value: ip || '—',  inline: true },
    ],
  })

export const logRegister = (username: string, rol: string, codigo: string) =>
  logWebhook({
    type:  'logins',
    title: '📝 Nuevo Registro',
    color: COLORS.blue,
    fields: [
      { name: 'Usuario', value: username, inline: true },
      { name: 'Rol',     value: rol,      inline: true },
      { name: 'Código',  value: codigo,   inline: true },
    ],
  })

export const logKeyAction = (action: string, by: string, detail: string) =>
  logWebhook({
    type:  'keys',
    title: `🔑 ${action}`,
    color: COLORS.yellow,
    fields: [
      { name: 'Por',     value: by,     inline: true },
      { name: 'Detalle', value: detail, inline: false },
    ],
  })

export const logExtra = (title: string, description: string, color?: Color) =>
  logWebhook({ type: 'extras', title, description, color: color ?? COLORS.gray })

export const logPersonalAction = (action: string, agente: string, by: string, detalle?: string) =>
  logWebhook({
    type:  'extras',
    title: `👤 ${action}`,
    color: COLORS.purple,
    fields: [
      { name: 'Agente',  value: agente,       inline: true },
      { name: 'Por',     value: by,           inline: true },
      { name: 'Detalle', value: detalle || '—', inline: false },
    ],
  })

export const logSancion = (agente: string, tipo: string, motivo: string, by: string) =>
  logWebhook({
    type:  'important',
    title: `⚠️ Sanción ${tipo}`,
    color: tipo === 'Grave' ? COLORS.red : COLORS.orange,
    fields: [
      { name: 'Agente', value: agente, inline: true },
      { name: 'Tipo',   value: tipo,   inline: true },
      { name: 'Por',    value: by,     inline: true },
      { name: 'Motivo', value: motivo, inline: false },
    ],
  })

export const logRegistroImportante = (accion: 'Ascenso' | 'Descenso' | 'Sanción' | 'Veto', agente: string, by: string, detalle: string) =>
  logWebhook({
    type: 'important',
    title: `📌 Registro Importante: ${accion}`,
    color: accion === 'Ascenso' ? COLORS.green : accion === 'Descenso' ? COLORS.yellow : accion === 'Veto' ? COLORS.red : COLORS.orange,
    fields: [
      { name: 'Agente', value: agente, inline: true },
      { name: 'Por', value: by, inline: true },
      { name: 'Acción', value: accion, inline: true },
      { name: 'Detalle', value: detalle || '—', inline: false },
    ],
  })

export const logAllanamiento = (action: string, numero: string, by: string, detail?: string) =>
  logWebhook({
    type:  'extras',
    title: `🏠 Allanamiento ${action}`,
    color: action === 'Autorizado' ? COLORS.green : action === 'Denegado' ? COLORS.red : COLORS.blue,
    fields: [
      { name: 'N°',      value: numero,       inline: true },
      { name: 'Por',     value: by,           inline: true },
      { name: 'Detalle', value: detail || '—', inline: false },
    ],
  })

export const logInviteCodes = (action: string, codigo: string, rol: string, by: string) =>
  logWebhook({
    type:  'keys',
    title: `🎫 Invitación ${action}`,
    color: action === 'Creada' ? COLORS.green : COLORS.red,
    fields: [
      { name: 'Código', value: `\`${codigo}\``, inline: true },
      { name: 'Rol',    value: rol,             inline: true },
      { name: 'Por',    value: by,              inline: true },
    ],
  })
