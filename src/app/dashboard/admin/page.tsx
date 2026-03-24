'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Copy, RefreshCw, Key, Users, CheckCircle, Shield } from 'lucide-react'
import { getInvites, crearInvite, borrarInvite, getUsers, editarUser } from '@/lib/client'

type Tab = 'invites' | 'users' | 'callsigns'

const ROL_TAG: Record<string,string> = {
  command_staff: 'tag border-red-800 bg-red-900/20 text-red-400',
  supervisory:   'tag border-blue-700 bg-blue-900/20 text-blue-400',
  federal_agent: 'tag border-green-700 bg-green-900/20 text-green-400',
  visitante:     'tag border-gray-700 text-gray-400',
}

function Toast({ msg, ok, onClose }: { msg:string;ok:boolean;onClose:()=>void }) {
  useEffect(()=>{ const t=setTimeout(onClose,3000);return()=>clearTimeout(t) },[])
  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 border font-mono text-xs ${ok?'bg-green-900/40 border-green-700 text-green-300':'bg-red-900/40 border-red-700 text-red-300'}`}>
      {ok?<CheckCircle size={13}/>:'✗'} {msg}
    </div>
  )
}

export default function AdminPage() {
  const [user,    setUser]    = useState<any>(null)
  const [tab,     setTab]     = useState<Tab>('invites')
  const [invites, setInvites] = useState<any[]>([])
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast,   setToast]   = useState<{msg:string;ok:boolean}|null>(null)
  const [copied,  setCopied]  = useState('')
  const [form,    setForm]    = useState({ rol:'federal_agent', maxUsos:1, discordId:'', agentNumber:'', nombre:'' })
  const [creating,setCreating]= useState(false)
  const [filtro,  setFiltro]  = useState<'todos'|'activos'|'agotados'>('todos')
  const [callsignEdit, setCallsignEdit] = useState<Record<string,string>>({})

  const isCS    = user?.rol === 'command_staff'
  const isSuperv= ['command_staff','supervisory'].includes(user?.rol)

  useEffect(() => { const u = localStorage.getItem('fib_user'); if (u) setUser(JSON.parse(u)) }, [])

  async function loadInvites() { setLoading(true); try { setInvites(await getInvites()) } catch {} finally { setLoading(false) } }
  async function loadUsers()   { setLoading(true); try { setUsers(await getUsers()) } catch {} finally { setLoading(false) } }

  useEffect(() => {
    if (tab==='invites') loadInvites()
    else if (tab==='users'||tab==='callsigns') loadUsers()
  }, [tab])

  async function create() {
    setCreating(true)
    try {
      await crearInvite({ rol:form.rol, maxUsos:Number(form.maxUsos), discordId:form.discordId||undefined, agentNumber:form.agentNumber||undefined, nombre:form.nombre||undefined })
      setToast({msg:'✅ Código creado',ok:true}); await loadInvites()
      setForm({ rol:'federal_agent', maxUsos:1, discordId:'', agentNumber:'', nombre:'' })
    } catch(e:any) { setToast({msg:e.message,ok:false}) }
    finally { setCreating(false) }
  }

  function copy(code:string) { navigator.clipboard.writeText(code); setCopied(code); setTimeout(()=>setCopied(''),2000) }

  async function toggleUser(id:string,activo:boolean) {
    try { await editarUser(id,{activo}); setToast({msg:`Usuario ${activo?'activado':'desactivado'}`,ok:true}); await loadUsers() }
    catch(e:any) { setToast({msg:e.message,ok:false}) }
  }

  async function saveCallsign(id:string, username:string) {
    const cs = callsignEdit[id]
    if (!cs?.trim()) return
    try {
      await editarUser(id,{callsign:cs.trim()})
      setToast({msg:`Callsign asignado a ${username}`,ok:true}); await loadUsers()
      setCallsignEdit(p=>({...p,[id]:''}))
    } catch(e:any) { setToast({msg:e.message,ok:false}) }
  }

  const filtrados = invites.filter(i => {
    if (filtro==='activos')  return !i.agotado
    if (filtro==='agotados') return i.agotado
    return true
  })

  const TABS = [
    { id:'invites' as Tab,   icon:Key,    label:'Invitaciones' },
    { id:'users' as Tab,     icon:Users,  label:'Usuarios' },
    { id:'callsigns' as Tab, icon:Shield, label:'Callsigns' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={()=>setToast(null)}/>}

      <div className="page-header">
        <span className="section-tag">// Administración</span>
        <h1 className="font-display text-xl font-semibold tracking-wider uppercase text-tx-primary mt-0.5">Panel Admin</h1>
        <p className="text-tx-muted text-xs mt-0.5">{isCS?'Command Staff — acceso total':'Supervisory — acceso parcial'}</p>
      </div>

      <div className="flex border-b border-bg-border mb-5">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all border-b-2 -mb-px ${tab===t.id?'border-accent-blue text-accent-blue':'border-transparent text-tx-muted hover:text-tx-secondary'}`}>
            <t.icon size={11}/>{t.label}
          </button>
        ))}
      </div>

      {/* INVITACIONES */}
      {tab==='invites' && (
        <>
          <div className="card p-4 mb-4">
            <span className="section-tag mb-3 block">// Crear Código</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div><label className="label">Nombre IC</label><input className="input text-xs py-2" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Juan García"/></div>
              <div><label className="label">Rol</label>
                <select className="input text-xs py-2" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}>
                  <option value="command_staff">Command Staff</option>
                  <option value="supervisory">Supervisory</option>
                  <option value="federal_agent">Federal Agent</option>
                  <option value="visitante">Visitante</option>
                </select>
              </div>
              <div><label className="label">Usos</label><input className="input text-xs py-2" type="number" min={1} max={10} value={form.maxUsos} onChange={e=>setForm(p=>({...p,maxUsos:Number(e.target.value)}))}/></div>
              <div><label className="label">Discord ID</label><input className="input text-xs py-2" placeholder="Opcional" value={form.discordId} onChange={e=>setForm(p=>({...p,discordId:e.target.value}))}/></div>
              <div><label className="label">N° Agente</label><input className="input text-xs py-2" placeholder="Opcional" value={form.agentNumber} onChange={e=>setForm(p=>({...p,agentNumber:e.target.value}))}/></div>
            </div>
            <button onClick={create} disabled={creating} className="btn-primary"><Plus size={12}/>{creating?'Creando...':'Generar Código'}</button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex border border-bg-border overflow-hidden">
              {(['todos','activos','agotados'] as const).map(f=>(
                <button key={f} onClick={()=>setFiltro(f)} className={`px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all ${filtro===f?'bg-accent-blue/10 text-accent-blue':'text-tx-muted hover:text-tx-secondary'}`}>{f}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{l:'Total',v:invites.length},{l:'Activos',v:invites.filter(i=>!i.agotado).length,c:'text-green-400'},{l:'Agotados',v:invites.filter(i=>i.agotado).length}].map(s=>(
                <div key={s.l} className="bg-bg-surface border border-bg-border px-3 py-2 text-center">
                  <p className={`font-display text-lg font-semibold ${s.c||'text-accent-blue'}`}>{s.v}</p>
                  <p className="font-mono text-[7px] text-tx-muted uppercase">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-bg-border">
                {['Código','Rol','Nombre','Usos','Creado por','Fecha','Usado por','Estado',''].map(h=><th key={h} className="table-head">{h}</th>)}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} className="text-center py-8 font-mono text-xs text-tx-muted">Cargando...</td></tr>
                : filtrados.map(inv=>(
                  <tr key={inv.codigo} className={`table-row ${inv.agotado?'opacity-40':''}`}>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-xs text-accent-blue bg-accent-blue/10 px-1.5 py-0.5">{inv.codigo}</code>
                        <button onClick={()=>copy(inv.codigo)} className="text-tx-muted hover:text-tx-primary">
                          {copied===inv.codigo?<CheckCircle size={10} className="text-green-400"/>:<Copy size={10}/>}
                        </button>
                      </div>
                    </td>
                    <td className="table-cell"><span className={ROL_TAG[inv.rol]||''}>{inv.rol?.replace('_',' ')}</span></td>
                    <td className="table-cell text-xs text-tx-secondary">{inv.nombre||'—'}</td>
                    <td className="table-cell font-mono text-xs text-tx-muted">{inv.usos}/{inv.maxUsos}</td>
                    <td className="table-cell text-xs text-tx-secondary">{inv.creadoPor}</td>
                    <td className="table-cell font-mono text-[9px] text-tx-muted whitespace-nowrap">{new Date(inv.creadoEn).toLocaleDateString('es')}</td>
                    <td className="table-cell text-xs text-tx-muted max-w-24 truncate">{inv.usadoPor?.join(', ')||'—'}</td>
                    <td className="table-cell"><span className={`tag border ${inv.agotado?'border-gray-700 text-gray-500':'border-green-700 text-green-400'}`}>{inv.agotado?'Agotado':'Activo'}</span></td>
                    <td className="table-cell"><button onClick={()=>borrarInvite(inv.codigo).then(loadInvites)} className="text-tx-muted hover:text-red-400"><Trash2 size={12}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* USUARIOS */}
      {tab==='users' && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <span className="section-tag">// Cuentas de la Plataforma</span>
            <button onClick={loadUsers} className="text-tx-muted hover:text-tx-primary"><RefreshCw size={12} className={loading?'animate-spin':''}/></button>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-bg-border">
              {['Usuario','Nombre IC','Rol','Callsign','N° Agente','Discord','Desde','Estado',''].map(h=><th key={h} className="table-head">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center py-8 font-mono text-xs text-tx-muted">Cargando...</td></tr>
              : users.length===0 ? <tr><td colSpan={9} className="text-center py-8 font-mono text-xs text-tx-muted">Sin usuarios</td></tr>
              : users.map(u=>(
                <tr key={u.id} className={`table-row ${!u.activo?'opacity-40':''}`}>
                  <td className="table-cell font-medium text-tx-primary">{u.username}</td>
                  <td className="table-cell text-xs text-tx-secondary">{u.nombre||'—'}</td>
                  <td className="table-cell"><span className={ROL_TAG[u.rol]||''}>{u.rol?.replace('_',' ')}</span></td>
                  <td className="table-cell font-mono text-xs text-accent-gold">{u.callsign||'—'}</td>
                  <td className="table-cell font-mono text-xs text-accent-blue">{u.agentNumber?`#${u.agentNumber}`:'—'}</td>
                  <td className="table-cell font-mono text-[9px] text-tx-muted">{u.discordId||'—'}</td>
                  <td className="table-cell font-mono text-[9px] text-tx-muted whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('es')}</td>
                  <td className="table-cell"><span className={`tag border ${u.activo?'border-green-700 text-green-400':'border-gray-700 text-gray-500'}`}>{u.activo?'Activo':'Inactivo'}</span></td>
                  <td className="table-cell">
                    {isCS && <button onClick={()=>toggleUser(u.id,!u.activo)} className={`font-mono text-[8px] tracking-widest uppercase px-2 py-1 border transition-colors ${u.activo?'border-red-800 text-red-400 hover:bg-red-900/20':'border-green-800 text-green-400 hover:bg-green-900/20'}`}>
                      {u.activo?'Desact.':'Activar'}
                    </button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CALLSIGNS */}
      {tab==='callsigns' && (
        <div>
          <div className="card p-4 mb-4 border-accent-gold/20 bg-accent-gold/5">
            <p className="font-mono text-[9px] text-accent-gold uppercase tracking-widest mb-1">¿Qué es un Callsign?</p>
            <p className="text-xs text-tx-secondary">Identificador de radio interno asignado manualmente. Aparece en el chat junto al nombre del agente. Ej: <code className="text-accent-gold">ALPHA-1</code>, <code className="text-accent-gold">BRAVO-7</code>.</p>
          </div>
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
              <span className="section-tag">// Asignar Callsigns</span>
              <button onClick={loadUsers} className="text-tx-muted hover:text-tx-primary"><RefreshCw size={12} className={loading?'animate-spin':''}/></button>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                {['Usuario','Nombre IC','Rol','Callsign Actual','Nuevo Callsign',''].map(h=><th key={h} className="table-head">{h}</th>)}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="text-center py-8 font-mono text-xs text-tx-muted">Cargando...</td></tr>
                : users.filter(u=>u.rol!=='visitante').map(u=>(
                  <tr key={u.id} className="table-row">
                    <td className="table-cell font-medium text-tx-primary">{u.username}</td>
                    <td className="table-cell text-xs text-tx-secondary">{u.nombre||'—'}</td>
                    <td className="table-cell"><span className={ROL_TAG[u.rol]||''}>{u.rol?.replace('_',' ')}</span></td>
                    <td className="table-cell">
                      <span className={`font-mono text-xs ${u.callsign?'text-accent-gold':'text-tx-muted'}`}>
                        {u.callsign||'Sin asignar'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <input className="input text-xs py-1.5 w-32 font-mono" placeholder="ALPHA-1"
                        value={callsignEdit[u.id]||''} onChange={e=>setCallsignEdit(p=>({...p,[u.id]:e.target.value}))}
                        onKeyDown={e=>e.key==='Enter'&&saveCallsign(u.id,u.username)}/>
                    </td>
                    <td className="table-cell">
                      <button onClick={()=>saveCallsign(u.id,u.username)} disabled={!callsignEdit[u.id]?.trim()} className="btn-primary text-[8px] py-1 px-2 disabled:opacity-30">Guardar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
