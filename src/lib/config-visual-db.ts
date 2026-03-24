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
  divisionesInfo:     [
    { nombre:'CIRG', descripcion:'Critical Incident Response Group', logoUrl:'https://i.imgur.com/QKAp6O1.png' },
    { nombre:'ERT',  descripcion:'Evidence Response Team',           logoUrl:'https://i.imgur.com/IemqOQh.png' },
    { nombre:'RRHH', descripcion:'Recursos Humanos',                 logoUrl:'https://i.imgur.com/z5NiemF.png' },
  ],
  actualizadoPor:'SYSTEM', actualizadoEn:new Date().toISOString(),
}

declare global { var __fibConfigVisual2: ConfigVisual | undefined }
if (!global.__fibConfigVisual2) global.__fibConfigVisual2 = { ...DEFAULT }

export const ConfigVisualDB = {
  get:   () => global.__fibConfigVisual2!,
  set:   (d: Partial<ConfigVisual>) => { global.__fibConfigVisual2 = { ...global.__fibConfigVisual2!, ...d } },
  reset: () => { global.__fibConfigVisual2 = { ...DEFAULT } },
}
