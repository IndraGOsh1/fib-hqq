'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Hash, MessageSquare, Plus, User, Lock, Star, Crown, Image as ImageIcon } from 'lucide-react'
import { getCanales, getMensajes, enviarMensaje, crearDM } from '@/lib/client'

function timeLabel(iso: string) {
  const d = new Date(iso), now = new Date()
  const diffH = (now.getTime()-d.getTime())/3600000
  return diffH < 24
    ? d.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})
    : d.toLocaleDateString('es',{day:'2-digit',month:'short'})
}

function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880; gain.gain.setValueAtTime(0.3,ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3)
    osc.start(); osc.stop(ctx.currentTime+0.3)
  } catch {}
}

const CANAL_ICON: Record<string,any> = {
  general:'#', unidad:'#', dm:User, supervisory:Star, comando:Crown
}

function CanvasPopup({ mensaje, onClose }: { mensaje:any; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-bg-card border border-bg-border max-w-lg w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
          <div>
            <p className="font-display text-xs font-semibold tracking-wider uppercase text-tx-primary">Mensaje de {mensaje.nombre}</p>
            {mensaje.callsign && <p className="font-mono text-[8px] text-accent-blue">[{mensaje.callsign}]</p>}
          </div>
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary font-mono text-lg">×</button>
        </div>
        <div className="p-4">
          {mensaje.tipo==='imagen'
            ? <img src={mensaje.contenido} alt="img" className="max-w-full max-h-80 object-contain mx-auto border border-bg-border"/>
            : <p className="text-sm text-tx-primary leading-relaxed">{mensaje.contenido}</p>
          }
          <p className="font-mono text-[8px] text-tx-muted mt-3">{new Date(mensaje.fecha).toLocaleString('es')}</p>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [user,          setUser]          = useState<any>(null)
  const [canalesData,   setCanalesData]   = useState<any>({ canales:[], totalDMUnread:0 })
  const [canalActivo,   setCanalActivo]   = useState('general')
  const [mensajes,      setMensajes]      = useState<any[]>([])
  const [texto,         setTexto]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [dmTarget,      setDmTarget]      = useState('')
  const [showDM,        setShowDM]        = useState(false)
  const [popup,         setPopup]         = useState<any>(null)
  const [lastCount,     setLastCount]     = useState(0)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => { const u = localStorage.getItem('fib_user'); if (u) setUser(JSON.parse(u)) }, [])

  const loadCanales = useCallback(async () => {
    try { const d = await getCanales(); setCanalesData(d) } catch {}
  }, [])

  const loadMensajes = useCallback(async () => {
    try {
      const msgs = await getMensajes(canalActivo)
      if (Array.isArray(msgs)) {
        // Play ping on new DM messages
        const canal = canalesData.canales?.find((c:any) => c.id===canalActivo)
        if (canal?.tipo==='dm' && msgs.length > lastCount && lastCount > 0) {
          const newest = msgs.slice(lastCount)
          const fromOther = newest.some((m:any) => m.autor !== user?.username)
          if (fromOther) playPing()
        }
        setLastCount(msgs.length)
        setMensajes(msgs)
      }
    } catch {}
  }, [canalActivo, lastCount, user, canalesData])

  useEffect(() => {
    setMensajes([]); setLastCount(0)
    loadMensajes()
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => { loadMensajes(); loadCanales() }, 2500)
    return () => clearInterval(pollRef.current)
  }, [canalActivo])

  useEffect(() => { loadCanales() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [mensajes])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    setSending(true)
    try { await enviarMensaje(canalActivo, texto.trim()); setTexto(''); await loadMensajes() }
    catch {} finally { setSending(false) }
  }

  async function abrirDM() {
    if (!dmTarget.trim()) return
    try {
      const r = await crearDM(dmTarget.trim())
      await loadCanales()
      setCanalActivo(r.id)
      setDmTarget(''); setShowDM(false)
    } catch(e:any) { alert(e.message) }
  }

  const canales: any[] = canalesData.canales || []
  const canalInfo = canales.find((c:any) => c.id===canalActivo)
  const generales = canales.filter((c:any) => c.tipo==='general')
  const unidades  = canales.filter((c:any) => c.tipo==='unidad')
  const privados  = canales.filter((c:any) => ['supervisory','comando'].includes(c.tipo))
  const dms       = canales.filter((c:any) => c.tipo==='dm')

  // Group messages by author proximity
  const grouped = mensajes.reduce((acc:any[],msg:any,i:number) => {
    const prev = mensajes[i-1]
    const same = prev?.autor===msg.autor
    const close = prev && (new Date(msg.fecha).getTime()-new Date(prev.fecha).getTime()) < 120000
    if (same && close && msg.tipo!=='sistema') { acc[acc.length-1].msgs.push(msg) }
    else { acc.push({ ...msg, msgs:[msg] }) }
    return acc
  }, [])

  function CanalBtn({ c }: { c:any }) {
    const isActive = canalActivo===c.id
    const other = c.tipo==='dm' ? (c.participantes?.find((p:string)=>p!==user?.username)||c.id) : null
    const label = c.tipo==='dm' ? other : (c.icono?`${c.icono} ${c.nombre}`:c.nombre)
    const unread = c.unread || 0
    return (
      <button onClick={()=>setCanalActivo(c.id)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 transition-all text-left group ${isActive?'bg-accent-blue/10 text-accent-blue':'text-tx-muted hover:text-tx-secondary hover:bg-bg-hover'}`}>
        {c.tipo==='dm'?<User size={10} className="shrink-0"/>:<Hash size={10} className="shrink-0"/>}
        <span className="font-mono text-[10px] truncate flex-1">{label}</span>
        {unread>0 && <span className="bg-red-500 text-white font-mono text-[8px] rounded-full px-1 min-w-[14px] text-center">{unread}</span>}
        {c.tipo==='supervisory' && <Star size={9} className="shrink-0 text-accent-gold/60"/>}
        {c.tipo==='comando' && <Crown size={9} className="shrink-0 text-red-500/60"/>}
      </button>
    )
  }

  const isSuperv = ['command_staff','supervisory'].includes(user?.rol)
  const isCS     = user?.rol === 'command_staff'
  const canWrite = canalInfo && (
    canalInfo.tipo==='dm' ||
    (canalInfo.tipo==='supervisory' && isSuperv) ||
    (canalInfo.tipo==='comando' && isCS) ||
    ['general','unidad'].includes(canalInfo.tipo)
  )

  return (
    <div className="h-[calc(100vh-7rem)] flex border border-bg-border overflow-hidden">
      {popup && <CanvasPopup mensaje={popup} onClose={()=>setPopup(null)}/>}

      {/* Sidebar */}
      <div className="w-52 bg-bg-card border-r border-bg-border flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-bg-border">
          <p className="font-display text-xs font-semibold tracking-widest uppercase text-tx-primary">Comunicaciones</p>
          <p className="font-mono text-[7px] text-tx-muted">FIB HQ · Tiempo real</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {generales.length>0 && <>
            <p className="px-3 py-1 font-mono text-[7px] tracking-widest uppercase text-tx-dim">General</p>
            {generales.map((c:any)=><CanalBtn key={c.id} c={c}/>)}
          </>}
          {unidades.length>0 && <>
            <p className="px-3 py-1 font-mono text-[7px] tracking-widest uppercase text-tx-dim mt-1">Unidades</p>
            {unidades.map((c:any)=><CanalBtn key={c.id} c={c}/>)}
          </>}
          {privados.length>0 && <>
            <p className="px-3 py-1 font-mono text-[7px] tracking-widest uppercase text-tx-dim mt-1">Restringido</p>
            {privados.map((c:any)=><CanalBtn key={c.id} c={c}/>)}
          </>}
          <div className="mt-1">
            <div className="flex items-center justify-between px-3 py-1">
              <p className="font-mono text-[7px] tracking-widest uppercase text-tx-dim">
                Mensajes Directos
                {canalesData.totalDMUnread>0 && <span className="ml-1 bg-red-500 text-white font-mono text-[7px] rounded-full px-1">{canalesData.totalDMUnread}</span>}
              </p>
              <button onClick={()=>setShowDM(p=>!p)} className="text-tx-dim hover:text-tx-muted"><Plus size={10}/></button>
            </div>
            {showDM && (
              <div className="px-3 pb-2 flex gap-1">
                <input className="input text-[10px] py-1 flex-1" placeholder="Usuario" value={dmTarget}
                  onChange={e=>setDmTarget(e.target.value)} onKeyDown={e=>e.key==='Enter'&&abrirDM()}/>
                <button onClick={abrirDM} className="text-accent-blue text-[10px] px-1.5 border border-accent-blue/40 hover:bg-accent-blue/10">→</button>
              </div>
            )}
            {dms.map((c:any)=><CanalBtn key={c.id} c={c}/>)}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-11 flex items-center gap-2 px-4 border-b border-bg-border shrink-0 bg-bg-card">
          <Hash size={13} className="text-tx-muted"/>
          <p className="font-display text-xs font-semibold tracking-wider uppercase text-tx-primary">
            {canalInfo?.icono && <span className="mr-1">{canalInfo.icono}</span>}
            {canalInfo?.tipo==='dm'
              ? (canalInfo.participantes?.find((p:string)=>p!==user?.username)||canalActivo)
              : (canalInfo?.nombre||canalActivo)
            }
          </p>
          {canalInfo?.descripcion && <p className="font-mono text-[8px] text-tx-muted hidden sm:block">— {canalInfo.descripcion}</p>}
          <div className="ml-auto flex items-center gap-2">
            {(canalInfo?.tipo==='supervisory'||canalInfo?.tipo==='comando') && (
              <div className="flex items-center gap-1">
                <Lock size={10} className="text-tx-muted"/>
                <span className="font-mono text-[7px] text-tx-muted uppercase">Restringido</span>
              </div>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"/>
            <span className="font-mono text-[7px] text-accent-green tracking-widest hidden sm:block">EN VIVO</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
          {mensajes.length===0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={28} className="text-tx-muted opacity-20 mx-auto mb-2"/>
                <p className="font-mono text-xs text-tx-muted tracking-widest uppercase">Sin mensajes</p>
              </div>
            </div>
          )}
          {grouped.map((group:any, gi:number) => (
            <div key={gi} className={`flex gap-3 py-0.5 hover:bg-bg-hover/30 rounded px-2 -mx-2 transition-colors ${group.tipo==='sistema'?'opacity-40 justify-center':''}`}>
              {group.tipo==='sistema' ? (
                <p className="font-mono text-[9px] text-tx-muted italic py-1">{group.msgs[0].contenido}</p>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="w-8 h-8 shrink-0 mt-0.5 bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center cursor-pointer hover:bg-accent-blue/30 transition-colors"
                    onClick={()=>canalInfo?.tipo==='dm'&&setPopup(group.msgs[group.msgs.length-1])}>
                    <span className="font-display text-[10px] font-bold text-accent-blue uppercase">{group.nombre?.[0]}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                      <span className={`font-display text-xs font-semibold tracking-wider uppercase ${group.autor===user?.username?'text-accent-cyan':'text-tx-primary'}`}>
                        {group.nombre}
                      </span>
                      {group.callsign && (
                        <span className="font-mono text-[8px] text-accent-gold border border-accent-gold/30 px-1">[{group.callsign}]</span>
                      )}
                      <span className="font-mono text-[8px] text-tx-muted">{timeLabel(group.fecha)}</span>
                    </div>
                    {group.msgs.map((m:any) => (
                      <div key={m.id} className="cursor-pointer group/msg" onClick={()=>canalInfo?.tipo==='dm'&&setPopup(m)}>
                        {m.tipo==='imagen'
                          ? <img src={m.contenido} alt="img" className="max-w-xs max-h-48 object-contain border border-bg-border mt-1 hover:opacity-90 transition-opacity" onError={e=>(e.target as any).style.display='none'} onClick={e=>{e.stopPropagation();window.open(m.contenido,'_blank')}}/>
                          : <p className="text-sm text-tx-secondary leading-relaxed break-words">{m.contenido}</p>
                        }
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <form onSubmit={enviar} className="px-4 py-3 border-t border-bg-border bg-bg-card shrink-0">
          {!canWrite ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-bg-border">
              <Lock size={12} className="text-tx-muted"/>
              <p className="font-mono text-[9px] text-tx-muted uppercase tracking-widest">No tienes acceso de escritura en este canal</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-bg-surface border border-bg-border focus-within:border-accent-blue transition-colors">
                <button type="button" onClick={()=>{const url=prompt('URL de imagen:');if(url?.trim())setTexto(url.trim())}}
                  className="px-2.5 py-2.5 text-tx-muted hover:text-accent-blue border-r border-bg-border transition-colors shrink-0">
                  <ImageIcon size={13}/>
                </button>
                <input ref={inputRef} className="flex-1 bg-transparent px-3 py-2.5 text-sm text-tx-primary placeholder-tx-muted focus:outline-none"
                  placeholder={`Mensaje en #${canalInfo?.nombre||canalActivo}...`}
                  value={texto} onChange={e=>setTexto(e.target.value)} disabled={sending} autoComplete="off"/>
                <button type="submit" disabled={sending||!texto.trim()} className="px-3 py-2.5 text-tx-muted hover:text-accent-blue disabled:opacity-30 transition-colors shrink-0">
                  <Send size={14}/>
                </button>
              </div>
              <p className="font-mono text-[7px] text-tx-dim mt-1.5 ml-1">Actualización cada 2.5s · 🖼 para imagen por URL · Enter para enviar</p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
