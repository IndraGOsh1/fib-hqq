'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, X, CheckCircle, AlertCircle, FileText, Check, XCircle } from 'lucide-react'
import { getAllanamientos, crearAllanamiento, editarAllanamiento } from '@/lib/client'

const ESTADO_TAG: Record<string,string> = {
  borrador:  'tag border-gray-700 text-gray-400',
  pendiente: 'tag border-yellow-700 bg-yellow-900/20 text-yellow-400',
  autorizado:'tag border-green-700 bg-green-900/20 text-green-400',
  denegado:  'tag border-red-700 bg-red-900/20 text-red-400',
  ejecutado: 'tag border-blue-700 bg-blue-900/20 text-blue-400',
}

function Toast({ msg, ok, onClose }: { msg:string; ok:boolean; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 border font-mono text-xs ${ok?'bg-green-900/40 border-green-700 text-green-300':'bg-red-900/40 border-red-700 text-red-300'}`}>
      {ok?<CheckCircle size={13}/>:<AlertCircle size={13}/>}{msg}
    </div>
  )
}

function ModalCrear({ onClose, onSuccess }: { onClose:()=>void; onSuccess:(m:string)=>void }) {
  const [form, setForm] = useState({ direccion:'', motivacion:'', descripcion:'', sospechoso:'', unidad:'General' })
  const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const set = (k:keyof typeof form) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(p=>({...p,[k]:e.target.value}))

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await crearAllanamiento(form); onSuccess('Solicitud enviada para autorización'); onClose() }
    catch(err:any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal w-full max-w-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <div><span className="section-tag">// Nueva Solicitud</span>
          <p className="font-display text-sm font-semibold tracking-wider uppercase text-tx-primary mt-0.5">Solicitud de Allanamiento</p></div>
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary"><X size={15}/></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-3.5">
          <div><label className="label">Dirección / Ubicación *</label><input className="input" value={form.direccion} onChange={set('direccion')} placeholder="Calle, número, zona" required /></div>
          <div><label className="label">Sospechoso(s) involucrado(s)</label><input className="input" value={form.sospechoso} onChange={set('sospechoso')} placeholder="Nombre o descripción del sospechoso" /></div>
          <div><label className="label">Motivación / Justificación *</label>
            <textarea className="input min-h-24 resize-none text-xs" value={form.motivacion} onChange={set('motivacion')} placeholder="Explica el motivo legal y evidencias que justifican el allanamiento..." required />
          </div>
          <div><label className="label">Descripción del operativo</label>
            <textarea className="input min-h-16 resize-none text-xs" value={form.descripcion} onChange={set('descripcion')} placeholder="Detalles adicionales del operativo planificado..." />
          </div>
          <div><label className="label">Unidad solicitante</label>
            <select className="input text-xs py-2" value={form.unidad} onChange={set('unidad')}>
              {['General','CIRG','ERT','RRHH','SOG','VCTF'].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading?'Enviando...':'Enviar Solicitud'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalVer({ item, user, onClose, onAction }: { item:any; user:any; onClose:()=>void; onAction:(m:string)=>void }) {
  const [motivo, setMotivo]   = useState('')
  const [obs,    setObs]      = useState(item.observaciones||'')
  const [loading, setLoading] = useState(false)
  const isSuperv = ['command_staff','supervisory'].includes(user?.rol)

  function generarPDF() {
    // Generar contenido del PDF como texto y abrir en nueva ventana para imprimir
    const contenido = `
FEDERAL INVESTIGATION BUREAU
SOLICITUD DE ALLANAMIENTO

N° Solicitud: ${item.numeroSolicitud}
Fecha: ${new Date(item.fechaSolicitud).toLocaleDateString('es')}
Unidad: ${item.unidad}

SOLICITANTE
Nombre: ${item.nombreSolicitante}
Usuario: ${item.solicitadoPor}

OBJETIVO
Dirección: ${item.direccion}
Sospechoso(s): ${item.sospechoso}

MOTIVACIÓN
${item.motivacion}

DESCRIPCIÓN
${item.descripcion||'N/A'}

${item.estado==='autorizado'?`AUTORIZACIÓN\nAutorizado por: ${item.autorizadoPor}\nFecha: ${new Date(item.autorizadoEn).toLocaleDateString('es')}`:''}

OBSERVACIONES
${item.observaciones||'Ninguna'}

Estado: ${item.estado.toUpperCase()}
    `.trim()
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<html><head><title>Allanamiento ${item.numeroSolicitud}</title><style>body{font-family:monospace;white-space:pre;padding:40px;line-height:1.6}</style></head><body>${contenido}</body></html>`)
      w.document.close(); w.print()
    }
    editarAllanamiento(item.id, {accion:'generar_pdf'}).then(()=>onAction('PDF generado')).catch(()=>{})
  }

  async function doAction(accion:string) {
    setLoading(true)
    try {
      await editarAllanamiento(item.id, { accion, motivo, observaciones:obs })
      const msgs: Record<string,string> = { autorizar:'Allanamiento autorizado', denegar:'Solicitud denegada', ejecutar:'Marcado como ejecutado' }
      onAction(msgs[accion]||'Actualizado'); onClose()
    } catch(e:any) { alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal w-full max-w-xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-bg-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[9px] text-accent-blue">{item.numeroSolicitud}</span>
              <span className={ESTADO_TAG[item.estado]||''}>{item.estado}</span>
            </div>
            <p className="font-display text-sm font-semibold tracking-wider uppercase text-tx-primary">{item.direccion}</p>
            <p className="font-mono text-[8px] text-tx-muted mt-0.5">{item.unidad} · {item.nombreSolicitante} · {new Date(item.fechaSolicitud).toLocaleDateString('es')}</p>
          </div>
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary shrink-0"><X size={15}/></button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-bg-surface border border-bg-border p-3">
              <p className="font-mono text-[8px] text-tx-muted uppercase mb-1">Sospechoso</p>
              <p className="text-xs text-tx-primary">{item.sospechoso||'No especificado'}</p>
            </div>
            <div className="bg-bg-surface border border-bg-border p-3">
              <p className="font-mono text-[8px] text-tx-muted uppercase mb-1">Motivación</p>
              <p className="text-xs text-tx-primary leading-relaxed whitespace-pre-wrap">{item.motivacion}</p>
            </div>
            {item.descripcion && (
              <div className="bg-bg-surface border border-bg-border p-3">
                <p className="font-mono text-[8px] text-tx-muted uppercase mb-1">Descripción</p>
                <p className="text-xs text-tx-secondary leading-relaxed">{item.descripcion}</p>
              </div>
            )}
            {item.autorizadoPor && (
              <div className="bg-green-900/10 border border-green-800/40 p-3">
                <p className="font-mono text-[8px] text-green-500 uppercase mb-1">Autorizado por</p>
                <p className="text-xs text-green-400">{item.autorizadoPor} — {new Date(item.autorizadoEn).toLocaleDateString('es')}</p>
              </div>
            )}
            {item.motivoDenegacion && (
              <div className="bg-red-900/10 border border-red-800/40 p-3">
                <p className="font-mono text-[8px] text-red-500 uppercase mb-1">Motivo de denegación</p>
                <p className="text-xs text-red-400">{item.motivoDenegacion}</p>
              </div>
            )}
          </div>

          {isSuperv && item.estado === 'pendiente' && (
            <div className="border border-bg-border p-3 flex flex-col gap-2">
              <p className="section-tag">// Decisión</p>
              <input className="input text-xs py-2" placeholder="Motivo / Observaciones" value={motivo} onChange={e=>setMotivo(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={()=>doAction('autorizar')} disabled={loading} className="btn-success flex-1 justify-center text-[9px]"><Check size={11}/>Autorizar</button>
                <button onClick={()=>doAction('denegar')}   disabled={loading} className="btn-danger  flex-1 justify-center text-[9px]"><XCircle size={11}/>Denegar</button>
              </div>
            </div>
          )}

          {isSuperv && item.estado === 'autorizado' && (
            <button onClick={()=>doAction('ejecutar')} disabled={loading} className="btn-primary justify-center text-[9px]">Marcar como Ejecutado</button>
          )}
        </div>

        <div className="px-5 pb-4 flex gap-2 border-t border-bg-border pt-3">
          <button onClick={generarPDF} className="btn-ghost py-2 text-[9px]"><FileText size={11}/>Generar / Imprimir PDF</button>
        </div>
      </div>
    </div>
  )
}

export default function AllanamientosPage() {
  const [user,    setUser]    = useState<any>(null)
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [viewItem,   setViewItem]   = useState<any>(null)
  const [toast,   setToast]   = useState<{msg:string;ok:boolean}|null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => { const u = localStorage.getItem('fib_user'); if (u) setUser(JSON.parse(u)) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p: Record<string,string> = {}
      if (filtroEstado) p.estado = filtroEstado
      const data = await getAllanamientos(p)
      setItems(Array.isArray(data)?data:[])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [filtroEstado])

  useEffect(() => { load() }, [load])
  const notify = (msg:string, ok=true) => { setToast({msg,ok}); load() }
  const pendientes = items.filter(i=>i.estado==='pendiente').length

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}
      {showCreate && <ModalCrear onClose={()=>setShowCreate(false)} onSuccess={m=>notify(m)}/>}
      {viewItem   && <ModalVer item={viewItem} user={user} onClose={()=>setViewItem(null)} onAction={m=>notify(m)}/>}

      <div className="flex items-center justify-between mb-5">
        <div className="page-header mb-0">
          <span className="section-tag">// Allanamientos</span>
          <h1 className="font-display text-xl font-semibold tracking-wider uppercase text-tx-primary mt-0.5">
            Solicitudes de Allanamiento
            {pendientes>0 && <span className="ml-2 font-mono text-[9px] bg-yellow-900/40 border border-yellow-700 text-yellow-400 px-2 py-0.5">{pendientes} pendiente{pendientes>1?'s':''}</span>}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost py-2 px-3"><RefreshCw size={12} className={loading?'animate-spin':''}/></button>
          <button onClick={()=>setShowCreate(true)} className="btn-primary py-2"><Plus size={12}/>Nueva Solicitud</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select className="input py-2 text-xs w-auto" value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {['pendiente','autorizado','denegado','ejecutado'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 font-mono text-xs text-tx-muted">Cargando...</div>
      : items.length===0 ? (
        <div className="card p-14 flex flex-col items-center gap-3 text-tx-muted">
          <p className="font-mono text-xs tracking-widest uppercase">Sin solicitudes</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-bg-border">
              {['N°','Dirección','Sospechoso','Estado','Unidad','Solicitante','Fecha','PDF',''].map(h=><th key={h} className="table-head whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {items.map(a=>(
                <tr key={a.id} className="table-row cursor-pointer" onClick={()=>setViewItem(a)}>
                  <td className="table-cell font-mono text-[9px] text-accent-blue">{a.numeroSolicitud}</td>
                  <td className="table-cell text-xs text-tx-primary max-w-36 truncate">{a.direccion}</td>
                  <td className="table-cell text-xs text-tx-secondary max-w-28 truncate">{a.sospechoso||'—'}</td>
                  <td className="table-cell"><span className={ESTADO_TAG[a.estado]||''}>{a.estado}</span></td>
                  <td className="table-cell text-xs text-tx-muted">{a.unidad}</td>
                  <td className="table-cell text-xs text-tx-secondary">{a.nombreSolicitante}</td>
                  <td className="table-cell font-mono text-[9px] text-tx-muted whitespace-nowrap">{new Date(a.fechaSolicitud).toLocaleDateString('es')}</td>
                  <td className="table-cell">
                    {a.pdfGenerado && <FileText size={12} className="text-green-400"/>}
                  </td>
                  <td className="table-cell text-tx-muted">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
