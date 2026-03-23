'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Copy, RefreshCw, Key, Users, CheckCircle, Clock, XCircle, Filter } from 'lucide-react'
import { getInvites, crearInvite, borrarInvite, getUsers, editarUser } from '@/lib/client'

type Tab = 'invites' | 'users'
type FiltroInvite = 'todos' | 'activos' | 'agotados'

const ROL_TAG: Record<string,string> = {
  command_staff: 'tag border-red-800 bg-red-900/20 text-red-400',
  supervisory:   'tag border-blue-800 bg-blue-900/20 text-blue-400',
  federal_agent: 'tag border-green-800 bg-green-900/20 text-green-400',
  visitante:     'tag border-gray-700 bg-gray-800/30 text-gray-400',
}

export default function AdminPage() {
  const [tab,     setTab]     = useState<Tab>('invites')
  const [invites, setInvites] = useState<any[]>([])
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating,setCreating]= useState(false)
  const [copied,  setCopied]  = useState('')
  const [filtro,  setFiltro]  = useState<FiltroInvite>('todos')
  const [form,    setForm]    = useState({ rol:'federal_agent', maxUsos:1, discordId:'', agentNumber:'', nombre:'' })

  async function loadInvites() { setLoading(true); try { setInvites(await getInvites()) } catch {} finally { setLoading(false) } }
  async function loadUsers()   { setLoading(true); try { setUsers(await getUsers()) }   catch {} finally { setLoading(false) } }

  useEffect(() => { if (tab==='invites') loadInvites(); else loadUsers() }, [tab])

  async function create() {
    setCreating(true)
    try {
      await crearInvite({ rol:form.rol, maxUsos:Number(form.maxUsos), discordId:form.discordId||undefined, agentNumber:form.agentNumber||undefined, nombre:form.nombre||undefined })
      await loadInvites()
      setForm({ rol:'federal_agent', maxUsos:1, discordId:'', agentNumber:'', nombre:'' })
    } catch {}
    finally { setCreating(false) }
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code).catch(()=>{})
    setCopied(code); setTimeout(()=>setCopied(''),2000)
  }

  async function toggleUser(id: string, activo: boolean) {
    try { await editarUser(id, { activo }); await loadUsers() } catch {}
  }

  // Filter invites
  const invitesFiltrados = invites.filter(inv => {
    if (filtro === 'activos')  return !inv.agotado
    if (filtro === 'agotados') return inv.agotado
    return true
  })

  const stats = {
    total:   invites.length,
    activos: invites.filter(i=>!i.agotado).length,
    usados:  invites.filter(i=>i.agotado).length,
    usos:    invites.reduce((a:number,i:any)=>a+i.usos,0),
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <span className="section-tag">// Administración</span>
        <h1 className="font-display text-xl font-semibold tracking-wider uppercase text-tx-primary mt-0.5">Panel Command Staff</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bg-border mb-5">
        {[{id:'invites' as Tab,icon:Key,label:'Códigos de Invitación'},{id:'users' as Tab,icon:Users,label:'Usuarios Web'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all border-b-2 -mb-px ${tab===t.id?'border-accent-blue text-accent-blue':'border-transparent text-tx-muted hover:text-tx-secondary'}`}>
            <t.icon size={12}/>{t.label}
          </button>
        ))}
      </div>

      {tab === 'invites' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-px bg-bg-border mb-4">
            {[
              ['Total Códigos', stats.total,   'text-tx-primary'],
              ['Activos',       stats.activos, 'text-green-400'],
              ['Agotados',      stats.usados,  'text-gray-400'],
              ['Usos Totales',  stats.usos,    'text-accent-blue'],
            ].map(([l,v,c])=>(
              <div key={l as string} className="bg-bg-card p-3">
                <p className={`font-display text-xl font-semibold ${c}`}>{v}</p>
                <p className="font-mono text-[8px] text-tx-muted tracking-widest uppercase mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* Create form */}
          <div className="card p-4 mb-4">
            <span className="section-tag mb-3 block">// Crear Código de Invitación</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div><label className="label">Nombre IC</label><input className="input text-xs py-2" placeholder="Juan García" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))}/></div>
              <div><label className="label">Rol</label>
                <select className="input text-xs py-2" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}>
                  <option value="command_staff">Command Staff</option>
                  <option value="supervisory">Supervisory</option>
                  <option value="federal_agent">Federal Agent</option>
                  <option value="visitante">Visitante</option>
                </select>
              </div>
              <div><label className="label">Usos máximos</label><input className="input text-xs py-2" type="number" min={1} max={10} value={form.maxUsos} onChange={e=>setForm(p=>({...p,maxUsos:Number(e.target.value)}))}/></div>
              <div><label className="label">Discord ID</label><input className="input text-xs py-2" placeholder="Opcional" value={form.discordId} onChange={e=>setForm(p=>({...p,discordId:e.target.value}))}/></div>
              <div><label className="label">N° Agente</label><input className="input text-xs py-2" placeholder="Opcional" value={form.agentNumber} onChange={e=>setForm(p=>({...p,agentNumber:e.target.value}))}/></div>
            </div>
            <button onClick={create} disabled={creating} className="btn-primary"><Plus size={12}/>{creating?'Creando...':'Generar Código'}</button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-3">
            <Filter size={12} className="text-tx-muted"/>
            {(['todos','activos','agotados'] as FiltroInvite[]).map(f=>(
              <button key={f} onClick={()=>setFiltro(f)}
                className={`font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 border transition-all ${filtro===f?'border-accent-blue text-accent-blue bg-accent-blue/10':'border-bg-border text-tx-muted hover:border-tx-muted'}`}>
                {f}
              </button>
            ))}
            <button onClick={loadInvites} className="ml-auto text-tx-muted hover:text-tx-primary"><RefreshCw size={12} className={loading?'animate-spin':''}/></button>
          </div>

          {/* Invite list */}
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                {['Estado','Código','Rol','Nombre','Usos','Creado por','Creado','Usado por',''].map(h=><th key={h} className="table-head">{h}</th>)}
              </tr></thead>
              <tbody>
                {invitesFiltrados.length===0 ? (
                  <tr><td colSpan={9} className="text-center py-10 font-mono text-xs text-tx-muted">Sin códigos</td></tr>
                ) : invitesFiltrados.map(inv=>(
                  <tr key={inv.codigo} className={`table-row ${inv.agotado?'opacity-50':''}`}>
                    <td className="table-cell">
                      {inv.agotado
                        ? <span className="flex items-center gap-1 font-mono text-[8px] text-gray-500"><XCircle size={10}/>Agotado</span>
                        : <span className="flex items-center gap-1 font-mono text-[8px] text-green-400"><CheckCircle size={10}/>Activo</span>
                      }
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-xs text-accent-blue bg-accent-blue/10 px-1.5 py-0.5">{inv.codigo}</code>
                        <button onClick={()=>copy(inv.codigo)} className="text-tx-muted hover:text-tx-primary transition-colors p-0.5">
                          <Copy size={10}/>
                        </button>
                        {copied===inv.codigo && <CheckCircle size={10} className="text-green-400"/>}
                      </div>
                    </td>
                    <td className="table-cell"><span className={ROL_TAG[inv.rol]||''}>{inv.rol.replace('_',' ')}</span></td>
                    <td className="table-cell text-xs text-tx-secondary">{inv.nombre||'—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {Array.from({length:inv.maxUsos}).map((_,i)=>(
                            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i<inv.usos?'bg-accent-blue':'bg-bg-border'}`}/>
                          ))}
                        </div>
                        <span className="font-mono text-[9px] text-tx-muted ml-1">{inv.usos}/{inv.maxUsos}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-tx-secondary">{inv.creadoPor}</td>
                    <td className="table-cell font-mono text-[9px] text-tx-muted whitespace-nowrap">{new Date(inv.creadoEn).toLocaleDateString('es')}</td>
                    <td className="table-cell">
                      {inv.usadoPor?.length > 0
                        ? <div className="flex flex-col gap-0.5">{inv.usadoPor.map((u:string)=><span key={u} className="font-mono text-[8px] text-accent-blue">{u}</span>)}</div>
                        : <span className="font-mono text-[8px] text-tx-muted">—</span>
                      }
                    </td>
                    <td className="table-cell">
                      {!inv.agotado && (
                        <button onClick={()=>borrarInvite(inv.codigo).then(loadInvites)} className="text-tx-muted hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <span className="section-tag">// Cuentas de la Plataforma</span>
            <button onClick={loadUsers} className="text-tx-muted hover:text-tx-primary"><RefreshCw size={12} className={loading?'animate-spin':''}/></button>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-bg-border">
              {['Usuario','Nombre IC','Rol','N° Agente','Discord ID','Desde','Estado',''].map(h=><th key={h} className="table-head">{h}</th>)}
            </tr></thead>
            <tbody>
              {users.length===0 ? (
                <tr><td colSpan={8} className="text-center py-10 font-mono text-xs text-tx-muted">Sin usuarios</td></tr>
              ) : users.map(u=>(
                <tr key={u.id} className={`table-row ${!u.activo?'opacity-40':''}`}>
                  <td className="table-cell font-medium text-tx-primary">{u.username}</td>
                  <td className="table-cell text-xs text-tx-secondary">{u.nombre||'—'}</td>
                  <td className="table-cell"><span className={ROL_TAG[u.rol]||''}>{u.rol?.replace('_',' ')}</span></td>
                  <td className="table-cell font-mono text-xs text-accent-blue">{u.agentNumber?`#${u.agentNumber}`:'—'}</td>
                  <td className="table-cell font-mono text-[9px] text-tx-muted">{u.discordId||'—'}</td>
                  <td className="table-cell font-mono text-[9px] text-tx-muted whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('es')}</td>
                  <td className="table-cell"><span className={`tag border ${u.activo?'border-green-800 text-green-400':'border-gray-700 text-gray-500'}`}>{u.activo?'Activo':'Inactivo'}</span></td>
                  <td className="table-cell">
                    <button onClick={()=>toggleUser(u.id,!u.activo)} className={`font-mono text-[8px] tracking-widest uppercase px-2 py-1 border transition-colors ${u.activo?'border-red-800 text-red-400 hover:bg-red-900/20':'border-green-800 text-green-400 hover:bg-green-900/20'}`}>
                      {u.activo?'Desact.':'Activar'}
                    </button>
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
