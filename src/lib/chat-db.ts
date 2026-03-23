export interface Mensaje {
  id:       string
  canal:    string
  autor:    string
  nombre:   string
  contenido:string
  imageUrl?: string
  fecha:    string
  tipo:     'texto' | 'sistema' | 'imagen'
}

export interface Canal {
  id:          string
  nombre:      string
  descripcion: string
  tipo:        'unidad' | 'dm' | 'general'
  unidad?:     string
  participantes?: string[]  // para DMs
  creadoEn:    string
}

declare global {
  var __fibChat: {
    canales:  Map<string, Canal>
    mensajes: Map<string, Mensaje[]>
  } | undefined
}

if (!global.__fibChat) {
  const now = new Date().toISOString()
  global.__fibChat = { canales: new Map(), mensajes: new Map() }

  const canalesDefault: Canal[] = [
    { id:'general',   nombre:'general',   descripcion:'Canal principal de la división',       tipo:'general', creadoEn:now },
    { id:'comando',   nombre:'comando',   descripcion:'Canal exclusivo Command Staff',          tipo:'unidad', unidad:'Command Staff', creadoEn:now },
    { id:'ert',       nombre:'ert',       descripcion:'Canal de la unidad ERT',                tipo:'unidad', unidad:'ERT', creadoEn:now },
    { id:'cirg',      nombre:'cirg',      descripcion:'Canal de la unidad CIRG',               tipo:'unidad', unidad:'CIRG', creadoEn:now },
    { id:'rrhh',      nombre:'rrhh',      descripcion:'Canal de RRHH',                         tipo:'unidad', unidad:'RRHH', creadoEn:now },
    { id:'operaciones',nombre:'operaciones',descripcion:'Coordinación de operativos activos',  tipo:'general', creadoEn:now },
  ]

  canalesDefault.forEach(c => {
    global.__fibChat!.canales.set(c.id, c)
    global.__fibChat!.mensajes.set(c.id, [])
  })

  // Seed messages
  const seed = [
    { canal:'general',    autor:'SYSTEM', nombre:'Sistema', contenido:'Bienvenidos al sistema de comunicaciones FIB HQ.', tipo:'sistema' as const },
    { canal:'ert',        autor:'SYSTEM', nombre:'Sistema', contenido:'Canal ERT inicializado.', tipo:'sistema' as const },
    { canal:'operaciones',autor:'SYSTEM', nombre:'Sistema', contenido:'Canal de operaciones listo.', tipo:'sistema' as const },
  ]
  seed.forEach(m => {
    const msg: Mensaje = { id:`msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, fecha:now, ...m }
    global.__fibChat!.mensajes.get(m.canal)!.push(msg)
  })
}

export const ChatDB = global.__fibChat!

