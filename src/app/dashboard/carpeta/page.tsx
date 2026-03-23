'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, FileText, StickyNote, Lock, X, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { getCarpeta, crearAnotacion, borrarCarpetaItem } from '@/lib/client'
import { getAgente } from '@/lib/client'

function Toast({ msg, ok, onClose }: { msg:string; ok:boolean; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 border font-mono text-xs ${ok?'bg-green-900/40 border-green-700 text-green-300':'bg-red-900/40 border-red-700 text-red-300'}`}>
      {ok?<CheckCircle size={13}/>:<AlertCircle size={13}/>}{msg}
    </div>
  )
}

export default function CarpetaPage() {
  const [user,     setUser]     = useState<any>(null)
  const [carpeta,  setCarpeta]  = useState<any>(null)
  const [agente,   setAgente]   = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState<{msg:string;ok:boolean}|null>(null)
  const [tab,      setTab]      = useState<'ficha'|'anotaciones'|'documentos'>('ficha')

  // New annotation form
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ titulo:'', contenido:'', privada:false })
  const [saving,   setSaving]   = useState(false)

  // Expanded annotation
  const [expanded, setExpanded] = useState<string|null>(null)

  useEffect(() => {
    const u = localStorage.getItem('fib_user')
    if (u) {
      const parsed = JSON.parse(u)
      setUser(parsed)
      // Load carpeta and agent data in parallel
      Promise.all([
        getCarpeta(),
        parsed.agentNumber ? getAgente(parsed.agentNumber) : Promise.resolve(null),
      ]).then(([c, a]) => {
        setCarpeta(c)
        if (a) setAgente(a)
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function guardarAnotacion(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await crearAnotacion(form)
      const c = await getCarpeta()
      setCarpeta(c)
      setForm({ titulo:'', contenido:'', privada:false })
      setShowForm(false)
      setToast({ msg:'Anotación guardada', ok:true })
    } catch(err:any) { setToast({ msg:err.message, ok:false }) }
    finally { setSaving(false) }
  }

  async function borrar(tipo: string, id: string) {
    if (!confirm('¿Eliminar esta entrada?')) return
    try {
      await borrarCarpetaItem(tipo, id)
      const c = await getCarpeta()
      setCarpeta(c)
      setToast({ msg:'Eliminado', ok:true })
    } catch {}
  }

  const ESTADO_TAG: Record<string,string> = {
    Activo:    'tag border-green-700 bg-green-900/20 text-green-400',
    Retirado:  'tag border-gray-700 text-gray-400',
    Expulsado: 'tag border-red-700 text-red-400',
    Vetado:    'tag border-gray-800 text-gray-600',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-mono text-xs text-tx-muted tracking-widest">Cargando carpeta...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}

      <div className="page-header">
        <span className="section-tag">// Carpeta Personal</span>
        <h1 className="font-display text-xl font-semibold tracking-wider uppercase text-tx-primary mt-0.5">
          {user?.nombre || user?.username}
        </h1>
        <p className="text-tx-muted text-sm">{user?.rol?.replace('_',' ')}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bg-border mb-5">
        {[
          { id:'ficha',       label:'Mi Ficha' },
          { id:'anotaciones', label:`Anotaciones (${carpeta?.anotaciones?.length||0})` },
          { id:'documentos',  label:`Documentos (${carpeta?.documentos?.length||0})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all border-b-2 -mb-px ${tab===t.id?'border-accent-blue text-accent-blue':'border-transparent text-tx-muted hover:text-tx-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* FICHA */}
      {tab === 'ficha' && (
        <div>
          {!agente ? (
            <div className="card p-10 text-center">
              <p className="font-mono text-xs text-tx-muted tracking-widest uppercase">No hay expediente vinculado a esta cuenta</p>
              <p className="font-mono text-[9px] text-tx-dim mt-2">Pide a Command Staff que vincule tu N° de agente</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Header card */}
              <div className="card p-5 flex items-start gap-5">
                <div className="w-14 h-14 bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center shrink-0">
                  <span className="font-display text-2xl font-bold text-accent-blue uppercase">{agente.nombre?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-tx-primary">{agente.nombre}</h2>
                    <span className={ESTADO_TAG[agente.estado]||'tag border-bg-border text-tx-muted'}>{agente.estado}</span>
                  </div>
                  <p className="text-tx-secondary text-sm">{agente.rango}</p>
                  <p className="font-mono text-[9px] text-tx-muted mt-0.5">{agente.seccion} · #{agente.numero}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ['Apodo', agente.apodo||'—'],
                  ['Fecha de Ingreso', agente.fechaIngreso||'—'],
                  ['Fecha de Baja', agente.fechaBaja||'—'],
                  ['Reingresos', agente.reingresos||'0'],
                  ['Discord', agente.discordId||'—'],
                  ['N° Agente', `#${agente.numero}`],
                ].map(([k,v]) => (
                  <div key={k} className="bg-bg-surface border border-bg-border p-3">
                    <p className="font-mono text-[8px] text-tx-muted uppercase mb-0.5">{k}</p>
                    <p className="text-xs text-tx-primary font-mono truncate">{v}</p>
                  </div>
                ))}
              </div>

              {/* Especialidades */}
              {agente.especial && (
                <div className="card p-4">
                  <p className="font-mono text-[9px] text-tx-muted uppercase mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {agente.especial.split(',').map((e:string) => (
                      <span key={e} className="tag border-accent-blue/40 bg-accent-blue/10 text-accent-blue">{e.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sanciones */}
              <div className="card p-4">
                <p className="font-mono text-[9px] text-tx-muted uppercase mb-3">Sanciones</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Leves',     agente.sLeves,     'text-yellow-400', 'border-yellow-800/40'],
                    ['Moderadas', agente.sModeradas, 'text-orange-400', 'border-orange-800/40'],
                    ['Graves',    agente.sGraves,    'text-red-400',    'border-red-800/40'],
                  ].map(([k,v,c,b]) => (
                    <div key={k} className={`bg-bg-surface border ${b} p-3 text-center`}>
                      <p className={`font-display text-2xl font-bold ${c}`}>{v||'0'}</p>
                      <p className="font-mono text-[8px] text-tx-muted uppercase mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial */}
              {agente.historial?.length > 0 && (
                <div className="card p-4">
                  <p className="font-mono text-[9px] text-tx-muted uppercase mb-3">Historial Reciente</p>
                  <div className="flex flex-col gap-1.5">
                    {agente.historial.slice(0,8).map((h:any, i:number) => (
                      <div key={i} className="flex items-start gap-3 py-1.5 border-b border-bg-border last:border-0">
                        <span className="font-mono text-[8px] text-tx-muted shrink-0 mt-0.5">{h.fecha}</span>
                        <div className="min-w-0">
                          <p className="font-mono text-[9px] text-accent-blue uppercase">{h.accion}</p>
                          <p className="text-xs text-tx-secondary truncate">{h.detalle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ANOTACIONES */}
      {tab === 'anotaciones' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[9px] text-tx-muted tracking-widest uppercase">Notas y anotaciones personales</p>
            <button onClick={() => setShowForm(p=>!p)} className="btn-primary py-2 text-[9px]"><Plus size={11}/>Nueva Anotación</button>
          </div>

          {showForm && (
            <form onSubmit={guardarAnotacion} className="card p-4 mb-4 flex flex-col gap-3">
              <div><label className="label">Título</label><input className="input" value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))} placeholder="Título de la anotación" required /></div>
              <div><label className="label">Contenido</label><textarea className="input min-h-32 resize-y text-xs" value={form.contenido} onChange={e=>setForm(p=>({...p,contenido:e.target.value}))} placeholder="Escribe aquí..." required /></div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.privada} onChange={e=>setForm(p=>({...p,privada:e.target.checked}))} className="w-3 h-3"/>
                  <div className="flex items-center gap-1">
                    <Lock size={10} className="text-tx-muted"/>
                    <span className="font-mono text-[9px] text-tx-muted uppercase">Privada</span>
                  </div>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>setShowForm(false)} className="btn-ghost py-1.5 px-3 text-[9px]">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary py-1.5 px-3 text-[9px]">{saving?'Guardando...':'Guardar'}</button>
                </div>
              </div>
            </form>
          )}

          {carpeta?.anotaciones?.length === 0 ? (
            <div className="card p-12 flex flex-col items-center gap-3 text-tx-muted">
              <StickyNote size={28} className="opacity-20"/>
              <p className="font-mono text-xs tracking-widest uppercase">Sin anotaciones</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {carpeta.anotaciones.slice().reverse().map((a:any) => (
                <div key={a.id} className="card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors"
                    onClick={() => setExpanded(expanded===a.id?null:a.id)}>
                    <StickyNote size={13} className="text-tx-muted shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-tx-primary truncate">{a.titulo}</p>
                      <p className="font-mono text-[8px] text-tx-muted">{new Date(a.fecha).toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'})}</p>
                    </div>
                    {a.privada && <Lock size={10} className="text-tx-muted shrink-0"/>}
                    <button onClick={e=>{e.stopPropagation();borrar('anotacion',a.id)}} className="text-tx-muted hover:text-red-400 transition-colors shrink-0 p-1">
                      <Trash2 size={12}/>
                    </button>
                    {expanded===a.id ? <ChevronUp size={13} className="text-tx-muted shrink-0"/> : <ChevronDown size={13} className="text-tx-muted shrink-0"/>}
                  </div>
                  {expanded===a.id && (
                    <div className="px-4 pb-4 border-t border-bg-border">
                      <p className="text-sm text-tx-secondary leading-relaxed whitespace-pre-wrap pt-3">{a.contenido}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENTOS */}
      {tab === 'documentos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[9px] text-tx-muted tracking-widest uppercase">Documentos y archivos personales</p>
          </div>
          {carpeta?.documentos?.length === 0 ? (
            <div className="card p-12 flex flex-col items-center gap-3 text-tx-muted">
              <FileText size={28} className="opacity-20"/>
              <p className="font-mono text-xs tracking-widest uppercase">Sin documentos</p>
              <p className="font-mono text-[9px] text-tx-dim">Los documentos subidos aparecerán aquí</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {carpeta.documentos.map((d:any) => (
                <div key={d.id} className="card px-4 py-3 flex items-center gap-3">
                  <FileText size={14} className="text-accent-blue shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-tx-primary font-medium truncate">{d.nombre}</p>
                    {d.descripcion && <p className="text-xs text-tx-secondary truncate">{d.descripcion}</p>}
                    <p className="font-mono text-[8px] text-tx-muted">{new Date(d.fecha).toLocaleDateString('es')}</p>
                  </div>
                  <button onClick={()=>borrar('documento',d.id)} className="text-tx-muted hover:text-red-400 transition-colors p-1">
                    <Trash2 size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
