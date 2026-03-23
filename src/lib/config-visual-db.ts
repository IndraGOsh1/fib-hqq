// Configuración visual global del sitio — gestionada por Command Staff

export interface ConfigVisual {
  // Identidad
  nombreDivision:    string
  descripcionDivision: string
  logoUrl:           string
  faviconUrl:        string

  // Colores
  colorPrimario:     string  // hex ej: #1B6FFF
  colorSidebar:      string  // hex ej: #101820
  colorAcento:       string  // hex ej: #00C4FF

  // Fondos
  fondoDashboardUrl: string  // URL imagen o vacío
  fondoHeroUrl:      string  // URL imagen página pública
  fondoOpacidad:     number  // 0-100

  // Dashboard
  bannerActivo:      boolean
  bannerTexto:       string
  bannerColor:       string  // 'blue' | 'red' | 'gold' | 'green'

  // Modo
  modoOscuroDefault: boolean

  // Última actualización
  actualizadoPor:    string
  actualizadoEn:     string
}

const DEFAULT: ConfigVisual = {
  nombreDivision:     'Federal Investigation Bureau',
  descripcionDivision:'División de investigación federal. Protegemos el estado de derecho.',
  logoUrl:            'https://i.imgur.com/EAimMhx.png',
  faviconUrl:         'https://i.imgur.com/EAimMhx.png',

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

  actualizadoPor:     'SYSTEM',
  actualizadoEn:      new Date().toISOString(),
}

declare global {
  // eslint-disable-next-line no-var
  var __fibConfigVisual: ConfigVisual | undefined
}

if (!global.__fibConfigVisual) {
  global.__fibConfigVisual = { ...DEFAULT }
}

export const ConfigVisualDB = {
  get: (): ConfigVisual => global.__fibConfigVisual!,
  set: (data: Partial<ConfigVisual>) => {
    global.__fibConfigVisual = { ...global.__fibConfigVisual!, ...data }
  },
  reset: () => { global.__fibConfigVisual = { ...DEFAULT } },
}
