export interface ConfigVisual {
  nombreDivision:     string
  descripcionDivision:string
  logoUrl:            string
  colorPrimario:      string
  colorSidebar:       string
  colorAcento:        string
  fondoDashboardUrl:  string
  fondoHeroUrl:       string
  fondoOpacidad:      number
  bannerActivo:       boolean
  bannerTexto:        string
  bannerColor:        string
  modoOscuroDefault:  boolean
  textoHero:          string
  textoSubhero:       string
  textoMision:        string
  divisionesInfo:     { nombre:string; descripcion:string; logoUrl:string }[]
  actualizadoPor:     string
  actualizadoEn:      string
}

const DEFAULT: ConfigVisual = {
  nombreDivision:     'Federal Investigation Bureau',
  descripcionDivision:'División de investigación federal. Protegemos el estado de derecho.',
  logoUrl:            'https://i.imgur.com/EAimMhx.png',
  colorPrimario:      '#1B6FFF',
  colorSidebar:       '#101820',
  colorAcento:        '#00C4FF',
  fondoDashboardUrl:  '',
  fondoHeroUrl:       '',
  fondoOpacidad:      20,
  bannerActivo:       false,
  bannerTexto:        '',
  bannerColor:        'blue',
  modoOscuroDefault:  true,
  textoHero:          'Federal Investigation Bureau',
  textoSubhero:       'Sistema centralizado de gestión operativa',
  textoMision:        'Proteger la integridad del estado de derecho mediante investigaciones federales de alto nivel, garantizando la seguridad de los ciudadanos y la justicia.',
  divisionesInfo:     [
    { nombre:'CIRG', descripcion:'Critical Incident Response Group', logoUrl:'https://i.imgur.com/QKAp6O1.png' },
    { nombre:'ERT',  descripcion:'Evidence Response Team',           logoUrl:'https://i.imgur.com/IemqOQh.png' },
    { nombre:'RRHH', descripcion:'Recursos Humanos',                 logoUrl:'https://i.imgur.com/z5NiemF.png' },
  ],
  actualizadoPor:'SYSTEM', actualizadoEn:new Date().toISOString(),
}

// ── Supabase persistence ──────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const isSupabaseEnabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
const ROW_KEY = 'singleton'

function getSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )!
  return createClient(url, key)
}

declare global { var __fibConfigVisual2: ConfigVisual | undefined }
if (!global.__fibConfigVisual2) global.__fibConfigVisual2 = { ...DEFAULT }

async function loadFromSupabase(): Promise<ConfigVisual> {
  try {
    const { data, error } = await getSupabase()
      .from('config_visual')
      .select('*')
      .eq('id', ROW_KEY)
      .single()
    if (error || !data) {
      // Insert default row
      await getSupabase().from('config_visual').upsert({ id: ROW_KEY, ...DEFAULT })
      return { ...DEFAULT }
    }
    const { id: _id, ...rest } = data
    return { ...DEFAULT, ...rest } as ConfigVisual
  } catch {
    return { ...DEFAULT }
  }
}

async function saveToSupabase(cfg: ConfigVisual) {
  try {
    await getSupabase().from('config_visual').upsert({ id: ROW_KEY, ...cfg })
  } catch(e) {
    console.error('[ConfigVisual] Supabase save error:', e)
  }
}

// Init
declare global { var __fibConfigVisualInit: Promise<void> | undefined }
if (!global.__fibConfigVisualInit) {
  global.__fibConfigVisualInit = isSupabaseEnabled
    ? loadFromSupabase().then(cfg => { global.__fibConfigVisual2 = cfg })
    : Promise.resolve()
}

export const ConfigVisualDB = {
  get: () => global.__fibConfigVisual2 ?? { ...DEFAULT },
  set: (d: Partial<ConfigVisual>) => {
    global.__fibConfigVisual2 = { ...global.__fibConfigVisual2!, ...d, actualizadoEn: new Date().toISOString() }
    if (isSupabaseEnabled) saveToSupabase(global.__fibConfigVisual2).catch(console.error)
  },
  reset: () => {
    global.__fibConfigVisual2 = { ...DEFAULT }
    if (isSupabaseEnabled) saveToSupabase(global.__fibConfigVisual2).catch(console.error)
  },
}
