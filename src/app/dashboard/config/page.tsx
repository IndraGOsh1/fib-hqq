'use client'
import { useEffect, useState } from 'react'
import { Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, Palette, Image, Type, Bell, RotateCcw } from 'lucide-react'
import { getConfigVisual, setConfigVisual, resetConfigVisual } from '@/lib/client'

function Toast({ msg, ok, onClose }: { msg:string; ok:boolean; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 border font-mono text-xs ${ok?'bg-green-900/40 border-green-700 text-green-300':'bg-red-900/40 border-red-700 text-red-300'}`}>
      {ok?<CheckCircle size={13}/>:<AlertCircle size={13}/>}{msg}
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={e=>onChange(e.target.value)}
          className="w-10 h-10 border border-bg-border bg-bg-surface cursor-pointer p-0.5" />
        <input className="input flex-1 font-mono text-xs py-2" value={value} onChange={e=>onChange(e.target.value)} placeholder="#1B6FFF" />
      </div>
    </div>
  )
}

function PreviewBadge({ color, label }: { color:string; label:string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-bg-surface border border-bg-border">
      <div className="w-4 h-4 rounded-sm" style={{ background: color }} />
      <span className="font-mono text-[9px] text-tx-muted uppercase">{label}</span>
      <span className="font-mono text-[9px] text-tx-secondary ml-auto">{color}</span>
    </div>
  )
}

export default function ConfigPage() {
  const [user,    setUser]    = useState<any>(null)
  const [config,  setConfig]  = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<{msg:string;ok:boolean}|null>(null)
  const [tab,     setTab]     = useState<'identidad'|'colores'|'fondos'|'banner'|'invitaciones'>('identidad')
  const [preview, setPreview] = useState(false)

  const isCS = user?.rol === 'command_staff'

  useEffect(() => {
    const u = localStorage.getItem('fib_user')
    if (u) setUser(JSON.parse(u))
    getConfigVisual().then(c => { setConfig(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const set = (k: string) => (v: any) => setConfig((p: any) => ({ ...p, [k]: v }))
  const setE = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => set(k)(e.target.value)

  async function guardar() {
    setSaving(true)
    try {
      await setConfigVisual(config)
      setToast({ msg:'Configuración guardada', ok:true })
      // Apply CSS variables live
      applyCSSVars(config)
    } catch(err:any) { setToast({ msg:err.message, ok:false }) }
    finally { setSaving(false) }
  }

  async function restablecer() {
    if (!confirm('¿Restablecer toda la configuración a los valores por defecto?')) return
    try {
      await resetConfigVisual()
      const c = await getConfigVisual()
      setConfig(c)
      applyCSSVars(c)
      setToast({ msg:'Restablecido', ok:true })
    } catch {}
  }

  function applyCSSVars(cfg: any) {
    const root = document.documentElement
    if (cfg.colorPrimario) root.style.setProperty('--color-accent-blue',  cfg.colorPrimario)
    if (cfg.colorAcento)   root.style.setProperty('--color-accent-cyan',  cfg.colorAcento)
    if (cfg.colorSidebar)  root.style.setProperty('--color-bg-card',      cfg.colorSidebar)
  }

  if (loading || !config) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-mono text-xs text-tx-muted tracking-widest">Cargando configuración...</p>
    </div>
  )

  const TABS = [
    { id:'identidad',    icon:Type,    label:'Identidad' },
    { id:'colores',      icon:Palette, label:'Colores' },
    { id:'fondos',       icon:Image,   label:'Fondos' },
    { id:'banner',       icon:Bell,    label:'Banner' },
    { id:'invitaciones', icon:Bell,    label:'Invitaciones' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}

      <div className="flex items-center justify-between mb-5">
        <div className="page-header mb-0">
          <span className="section-tag">// Configuración</span>
          <h1 className="font-display text-xl font-semibold tracking-wider uppercase text-tx-primary mt-0.5">Panel de Configuración</h1>
        </div>
        {isCS && (
          <div className="flex gap-2">
            <button onClick={restablecer} className="btn-ghost py-2 px-3 text-[9px]"><RotateCcw size={12}/>Restablecer</button>
            <button onClick={guardar} disabled={saving} className="btn-primary py-2"><Save size={12}/>{saving?'Guardando...':'Guardar Cambios'}</button>
          </div>
        )}
      </div>

      {!isCS && (
        <div className="card p-4 mb-5 border-yellow-800/40 bg-yellow-900/10">
          <p className="font-mono text-xs text-yellow-400">Solo Command Staff puede modificar la configuración visual global.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-bg-border mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all border-b-2 -mb-px whitespace-nowrap ${tab===t.id?'border-accent-blue text-accent-blue':'border-transparent text-tx-muted hover:text-tx-secondary'}`}>
            <t.icon size={11}/>{t.label}
          </button>
        ))}
      </div>

      {/* IDENTIDAD */}
      {tab === 'identidad' && (
        <div className="flex flex-col gap-5">
          <div className="card p-5 flex flex-col gap-4">
            <span className="section-tag">// Información de la División</span>
            <div>
              <label className="label">Nombre de la División</label>
              <input className="input" value={config.nombreDivision} onChange={setE('nombreDivision')} disabled={!isCS} />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input min-h-20 resize-none text-sm" value={config.descripcionDivision} onChange={setE('descripcionDivision')} disabled={!isCS} />
            </div>
          </div>

          <div className="card p-5 flex flex-col gap-4">
            <span className="section-tag">// Imágenes de Identidad</span>
            <div>
              <label className="label">URL del Logo Principal</label>
              <div className="flex gap-3 items-start">
                <input className="input flex-1 text-xs py-2" value={config.logoUrl} onChange={setE('logoUrl')} placeholder="https://i.imgur.com/..." disabled={!isCS} />
                {config.logoUrl && <img src={config.logoUrl} alt="logo" className="w-12 h-12 object-contain border border-bg-border bg-bg-surface p-1" />}
              </div>
            </div>
            <div>
              <label className="label">URL del Favicon</label>
              <input className="input text-xs py-2" value={config.faviconUrl} onChange={setE('faviconUrl')} placeholder="https://..." disabled={!isCS} />
            </div>
          </div>
        </div>
      )}

      {/* COLORES */}
      {tab === 'colores' && (
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <span className="section-tag block mb-4">// Paleta de Colores</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorInput label="Color Primario (botones, links)" value={config.colorPrimario} onChange={set('colorPrimario')} />
              <ColorInput label="Color Acento (cyan, detalles)" value={config.colorAcento} onChange={set('colorAcento')} />
              <ColorInput label="Color Sidebar (fondo barra lateral)" value={config.colorSidebar} onChange={set('colorSidebar')} />
            </div>
          </div>

          {/* Live preview */}
          <div className="card p-5">
            <span className="section-tag block mb-4">// Vista Previa</span>
            <div className="flex flex-col gap-2">
              <PreviewBadge color={config.colorPrimario} label="Color Primario" />
              <PreviewBadge color={config.colorAcento}   label="Color Acento" />
              <PreviewBadge color={config.colorSidebar}  label="Color Sidebar" />
            </div>
            <div className="flex gap-3 mt-4">
              <button style={{ background: config.colorPrimario }} className="px-4 py-2 text-white font-mono text-xs tracking-widest uppercase">Botón Primario</button>
              <button style={{ borderColor: config.colorPrimario, color: config.colorPrimario }} className="px-4 py-2 border font-mono text-xs tracking-widest uppercase bg-transparent">Botón Ghost</button>
            </div>
          </div>

          {isCS && (
            <div className="card p-4">
              <p className="font-mono text-[9px] text-tx-muted">Los cambios de color se aplican inmediatamente en tu sesión al guardar. Otros usuarios verán los cambios al recargar la página.</p>
            </div>
          )}
        </div>
      )}

      {/* FONDOS */}
      {tab === 'fondos' && (
        <div className="flex flex-col gap-5">
          <div className="card p-5 flex flex-col gap-4">
            <span className="section-tag">// Imagen de Fondo — Dashboard</span>
            <div>
              <label className="label">URL de la imagen (deja vacío para sin fondo)</label>
              <input className="input text-xs py-2" value={config.fondoDashboardUrl} onChange={setE('fondoDashboardUrl')} placeholder="https://i.imgur.com/..." disabled={!isCS} />
            </div>
            {config.fondoDashboardUrl && (
              <div className="relative h-32 overflow-hidden border border-bg-border">
                <img src={config.fondoDashboardUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-mono text-xs text-white bg-black/50 px-3 py-1">Vista previa dashboard</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5 flex flex-col gap-4">
            <span className="section-tag">// Imagen de Fondo — Página Pública (Hero)</span>
            <div>
              <label className="label">URL de la imagen del hero</label>
              <input className="input text-xs py-2" value={config.fondoHeroUrl} onChange={setE('fondoHeroUrl')} placeholder="https://i.imgur.com/..." disabled={!isCS} />
            </div>
            {config.fondoHeroUrl && (
              <div className="relative h-32 overflow-hidden border border-bg-border">
                <img src={config.fondoHeroUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-mono text-xs text-white bg-black/50 px-3 py-1">Vista previa hero</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <span className="section-tag block mb-3">// Opacidad del Fondo</span>
            <div className="flex items-center gap-4">
              <input type="range" min={0} max={100} value={config.fondoOpacidad} onChange={e=>set('fondoOpacidad')(Number(e.target.value))}
                className="flex-1" disabled={!isCS} />
              <span className="font-mono text-sm text-accent-blue w-12 text-right">{config.fondoOpacidad}%</span>
            </div>
            <p className="font-mono text-[9px] text-tx-muted mt-2">Controla qué tan visible es la imagen de fondo sobre el color base.</p>
          </div>
        </div>
      )}

      {/* BANNER */}
      {tab === 'banner' && (
        <div className="flex flex-col gap-5">
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="section-tag">// Banner del Dashboard</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.bannerActivo} onChange={e=>set('bannerActivo')(e.target.checked)} disabled={!isCS}
                  className="w-4 h-4" />
                <span className="font-mono text-[9px] text-tx-muted uppercase">{config.bannerActivo?'Activo':'Inactivo'}</span>
              </label>
            </div>

            <div>
              <label className="label">Texto del banner</label>
              <input className="input" value={config.bannerTexto} onChange={setE('bannerTexto')} placeholder="Ej: ¡Bienvenidos a la nueva versión del sistema HQ!" disabled={!isCS} />
            </div>

            <div>
              <label className="label">Color del banner</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id:'blue',  label:'Azul',  cls:'bg-blue-900/40 border-blue-700 text-blue-300' },
                  { id:'red',   label:'Rojo',  cls:'bg-red-900/40 border-red-700 text-red-300' },
                  { id:'gold',  label:'Dorado',cls:'bg-yellow-900/40 border-yellow-700 text-yellow-300' },
                  { id:'green', label:'Verde', cls:'bg-green-900/40 border-green-700 text-green-300' },
                ].map(c => (
                  <button key={c.id} onClick={()=>isCS&&set('bannerColor')(c.id)}
                    className={`py-2 border font-mono text-[9px] tracking-widest uppercase transition-all ${c.cls} ${config.bannerColor===c.id?'ring-2 ring-accent-blue':''} ${!isCS?'opacity-50 cursor-not-allowed':''}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {config.bannerActivo && config.bannerTexto && (
              <div className={`p-3 border font-mono text-xs ${
                config.bannerColor==='red'  ?'bg-red-900/30 border-red-800 text-red-300':
                config.bannerColor==='gold' ?'bg-yellow-900/30 border-yellow-800 text-yellow-300':
                config.bannerColor==='green'?'bg-green-900/30 border-green-800 text-green-300':
                'bg-blue-900/30 border-blue-800 text-blue-300'
              }`}>
                📢 {config.bannerTexto}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INVITACIONES */}
      {tab === 'invitaciones' && <InvitacionesPanel />}
    </div>
  )
}

// ── Invitaciones Panel ────────────────────────────────────────────────────────
function InvitacionesPanel() {
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState<'todos'|'activos'|'agotados'>('todos')
  const [copied,  setCopied]  = useState('')

  useEffect(() => {
    import('@/lib/client').then(({ getInvites }) =>
      getInvites().then(d => { setInvites(Array.isArray(d)?d:[]); setLoading(false) }).catch(()=>setLoading(false))
    )
  }, [])

  async function borrar(codigo: string) {
    const { borrarInvite } = await import('@/lib/client')
    await borrarInvite(codigo)
    setInvites(p => p.filter(i => i.codigo !== codigo))
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code); setTimeout(() => setCopied(''), 2000)
  }

  const filtrados = invites.filter(i => {
    if (filtro === 'activos')  return !i.agotado
    if (filtro === 'agotados') return i.agotado
    return true
  })

  const ROL_TAG: Record<string,string> = {
    command_staff: 'tag border-red-800 bg-red-900/20 text-red-400',
    supervisory:   'tag border-blue-800 bg-blue-900/20 text-blue-400',
    federal_agent: 'tag border-green-800 bg-green-900/20 text-green-400',
    visitante:     'tag border-gray-700 text-gray-400',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-tag">// Todos los Códigos de Invitación</span>
        <div className="flex border border-bg-border overflow-hidden">
          {(['todos','activos','agotados'] as const).map(f => (
            <button key={f} onClick={()=>setFiltro(f)}
              className={`px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all ${filtro===f?'bg-accent-blue/10 text-accent-blue':'text-tx-muted hover:text-tx-secondary'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total creados',  value: invites.length },
          { label:'Activos',        value: invites.filter(i=>!i.agotado).length, color:'text-green-400' },
          { label:'Agotados/Usados',value: invites.filter(i=>i.agotado).length,  color:'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-bg-surface border border-bg-border p-3">
            <p className={`font-display text-2xl font-semibold ${s.color||'text-accent-blue'}`}>{s.value}</p>
            <p className="font-mono text-[8px] text-tx-muted uppercase mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="text-center py-8 font-mono text-xs text-tx-muted">Cargando...</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                {['Código','Rol','Nombre','Usos','Creado por','Fecha','Usado por','Estado',''].map(h=>(
                  <th key={h} className="table-head whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 font-mono text-xs text-tx-muted">Sin códigos</td></tr>
              ) : filtrados.map(inv => (
                <tr key={inv.codigo} className={`table-row ${inv.agotado?'opacity-50':''}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono text-xs text-accent-blue bg-accent-blue/10 px-1.5 py-0.5">{inv.codigo}</code>
                      <button onClick={()=>copy(inv.codigo)} className="text-tx-muted hover:text-tx-primary">
                        {copied===inv.codigo ? <CheckCircle size={10} className="text-green-400"/> : <span className="text-[10px]">⧉</span>}
                      </button>
                    </div>
                  </td>
                  <td className="table-cell"><span className={ROL_TAG[inv.rol]||''}>{inv.rol?.replace('_',' ')}</span></td>
                  <td className="table-cell text-xs text-tx-secondary">{inv.nombre||'—'}</td>
                  <td className="table-cell font-mono text-xs text-tx-muted">{inv.usos}/{inv.maxUsos}</td>
                  <td className="table-cell text-xs text-tx-secondary">{inv.creadoPor}</td>
                  <td className="table-cell font-mono text-[9px] text-tx-muted whitespace-nowrap">{new Date(inv.creadoEn).toLocaleDateString('es')}</td>
                  <td className="table-cell text-xs text-tx-muted max-w-32 truncate">{inv.usadoPor?.join(', ')||'—'}</td>
                  <td className="table-cell">
                    <span className={`tag border ${inv.agotado?'border-gray-700 text-gray-500':'border-green-700 text-green-400'}`}>
                      {inv.agotado?'Agotado':'Activo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {!inv.agotado && (
                      <button onClick={()=>borrar(inv.codigo)} className="text-tx-muted hover:text-red-400 transition-colors font-mono text-[9px]">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
