'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Hash, MessageSquare, Plus, User, Image } from 'lucide-react'
import { getCanales, getMensajes, enviarMensaje, crearDM } from '@/lib/client'

function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 24) return d.toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })
  return d.toLocaleDateString('es', { day:'2-digit', month:'short' })
}

export default function ChatPage() {
  const [user,      setUser]      = useState<any>(null)
  const [canales,   setCanales]   = useState<any[]>([])
  const [canalActivo, setCanalActivo] = useState<string>('general')
  const [mensajes,  setMensajes]  = useState<any[]>([])
  const [texto,     setTexto]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [dmTarget,  setDmTarget]  = useState('')
  const [showDM,    setShowDM]    = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const pollRef   = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const u = localStorage.getItem('fib_user')
    if (u) setUser(JSON.parse(u))
  }, [])

  // Load channels
  useEffect(() => {
    getCanales().then(setCanales).catch(() => {})
  }, [])

  // Load & poll messages
  const loadMensajes = useCallback(async () => {
    try {
      const msgs = await getMensajes(canalActivo)
      setMensajes(Array.isArray(msgs) ? msgs : [])
    } catch {}
  }, [canalActivo])

  useEffect(() => {
    loadMensajes()
    clearInterval(pollRef.current)
    pollRef.current = setInterval(loadMensajes, 3000)
    return () => clearInterval(pollRef.current)
  }, [loadMensajes])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    setSending(true)
    try {
      await enviarMensaje(canalActivo, texto.trim())
      setTexto('')
      await loadMensajes()
      inputRef.current?.focus()
    } catch {}
    finally { setSending(false) }
  }

  function isImageUrl(text: string) {
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(text.trim())
  }

  async function enviarImagen() {
    const url = prompt('Pega la URL de la imagen (Imgur, etc.):')
    if (!url?.trim()) return
    try {
      await enviarMensaje(canalActivo, `[img]${url.trim()}[/img]`)
      await loadMensajes()
    } catch {}
  }

  async function abrirDM() {
    if (!dmTarget.trim()) return
    try {
      const r = await crearDM([user.username, dmTarget.trim()])
      const updated = await getCanales()
      setCanales(updated)
      setCanalActivo(r.id)
      setDmTarget(''); setShowDM(false)
    } catch(e: any) { alert(e.message) }
  }

  const canal = canales.find(c => c.id === canalActivo)

  // Group messages by author + time proximity
  const grouped = mensajes.reduce((acc: any[], msg: any, i: number) => {
    const prev = mensajes[i - 1]
    const sameAuthor = prev?.autor === msg.autor
    const close = prev && (new Date(msg.fecha).getTime() - new Date(prev.fecha).getTime()) < 120000
    if (sameAuthor && close && msg.tipo !== 'sistema') {
      acc[acc.length - 1].msgs.push(msg)
    } else {
      acc.push({ autor: msg.autor, nombre: msg.nombre, fecha: msg.fecha, tipo: msg.tipo, msgs: [msg] })
    }
    return acc
  }, [])

  const unidades = canales.filter(c => c.tipo === 'unidad')
  const generales = canales.filter(c => c.tipo === 'general')
  const dms = canales.filter(c => c.tipo === 'dm')

  return (
    <div className="h-[calc(100vh-7rem)] flex border border-bg-border overflow-hidden">

      {/* Sidebar canales */}
      <div className="w-52 bg-bg-card border-r border-bg-border flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-bg-border">
          <p className="font-display text-xs font-semibold tracking-widest uppercase text-tx-primary">FIB — Chat</p>
          <p className="font-mono text-[7px] text-tx-muted tracking-widest">Sistema interno</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Canales generales */}
          {generales.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 font-mono text-[7px] tracking-widest uppercase text-tx-dim">General</p>
              {generales.map(c => (
                <button key={c.id} onClick={() => setCanalActivo(c.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 transition-all text-left ${canalActivo===c.id?'bg-accent-blue/10 text-accent-blue':'text-tx-muted hover:text-tx-secondary hover:bg-bg-hover'}`}>
                  <Hash size={11} className="shrink-0"/>
                  <span className="font-mono text-[10px] truncate">{c.nombre}</span>
                </button>
              ))}
            </div>
          )}

          {/* Canales de unidad */}
          {unidades.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 font-mono text-[7px] tracking-widest uppercase text-tx-dim">Unidades</p>
              {unidades.map(c => (
                <button key={c.id} onClick={() => setCanalActivo(c.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 transition-all text-left ${canalActivo===c.id?'bg-accent-blue/10 text-accent-blue':'text-tx-muted hover:text-tx-secondary hover:bg-bg-hover'}`}>
                  <Hash size={11} className="shrink-0"/>
                  <span className="font-mono text-[10px] truncate">{c.nombre}</span>
                </button>
              ))}
            </div>
          )}

          {/* DMs */}
          <div>
            <div className="flex items-center justify-between px-3 py-1">
              <p className="font-mono text-[7px] tracking-widest uppercase text-tx-dim">Mensajes Directos</p>
              <button onClick={() => setShowDM(p=>!p)} className="text-tx-dim hover:text-tx-muted"><Plus size={10}/></button>
            </div>
            {showDM && (
              <div className="px-3 pb-2 flex gap-1">
                <input className="input text-[10px] py-1 flex-1" placeholder="Usuario" value={dmTarget} onChange={e=>setDmTarget(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&abrirDM()} />
                <button onClick={abrirDM} className="text-accent-blue text-[10px] px-1.5 border border-accent-blue/40 hover:bg-accent-blue/10 transition-colors">→</button>
              </div>
            )}
            {dms.map(c => {
              const other = c.participantes?.find((p:string) => p !== user?.username) || c.nombre
              return (
                <button key={c.id} onClick={() => setCanalActivo(c.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 transition-all text-left ${canalActivo===c.id?'bg-accent-blue/10 text-accent-blue':'text-tx-muted hover:text-tx-secondary hover:bg-bg-hover'}`}>
                  <User size={10} className="shrink-0"/>
                  <span className="font-mono text-[10px] truncate">{other}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-11 flex items-center gap-2 px-4 border-b border-bg-border shrink-0 bg-bg-card">
          <Hash size={13} className="text-tx-muted"/>
          <p className="font-display text-xs font-semibold tracking-wider uppercase text-tx-primary">{canal?.nombre || canalActivo}</p>
          {canal?.descripcion && <p className="font-mono text-[9px] text-tx-muted ml-2 hidden sm:block">— {canal.descripcion}</p>}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"/>
            <span className="font-mono text-[8px] text-accent-green tracking-widest hidden sm:block">EN VIVO</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
          {mensajes.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={28} className="text-tx-muted opacity-20 mx-auto mb-2"/>
                <p className="font-mono text-xs text-tx-muted tracking-widest uppercase">Sin mensajes</p>
                <p className="font-mono text-[9px] text-tx-dim mt-1">Sé el primero en escribir</p>
              </div>
            </div>
          )}

          {grouped.map((group, gi) => (
            <div key={gi} className={`flex gap-3 py-0.5 hover:bg-bg-hover/30 rounded px-2 -mx-2 transition-colors ${group.tipo==='sistema'?'opacity-50':''}`}>
              {/* Avatar */}
              <div className="w-7 h-7 shrink-0 mt-0.5">
                {group.tipo === 'sistema' ? (
                  <div className="w-7 h-7 bg-bg-border flex items-center justify-center">
                    <span className="font-mono text-[8px] text-tx-muted">SYS</span>
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center">
                    <span className="font-display text-[9px] font-bold text-accent-blue uppercase">{group.nombre?.[0]}</span>
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`font-display text-xs font-semibold tracking-wider uppercase ${group.tipo==='sistema'?'text-tx-muted':group.autor===user?.username?'text-accent-cyan':'text-tx-primary'}`}>
                    {group.nombre}
                  </span>
                  <span className="font-mono text-[8px] text-tx-muted">{timeLabel(group.fecha)}</span>
                </div>
                {group.msgs.map((m: any) => {
                  const isImg = m.contenido.startsWith('[img]') && m.contenido.endsWith('[/img]')
                  const imgUrl = isImg ? m.contenido.slice(5,-6) : null
                  return (
                    <div key={m.id}>
                      {imgUrl ? (
                        <img src={imgUrl} alt="imagen" className="max-w-xs max-h-64 object-contain rounded border border-bg-border mt-1 cursor-pointer" onClick={()=>window.open(imgUrl,'_blank')} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
                      ) : (
                        <p className="text-sm text-tx-secondary leading-relaxed break-words">{m.contenido}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviar} className="px-4 py-3 border-t border-bg-border bg-bg-card shrink-0">
          <div className="flex items-center gap-2 bg-bg-surface border border-bg-border focus-within:border-accent-blue transition-colors">
            <button type="button" onClick={enviarImagen} className="px-3 py-2.5 text-tx-muted hover:text-accent-blue transition-colors shrink-0 border-r border-bg-border" title="Enviar imagen">
              <Image size={14} className="text-current"/>
            </button>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-tx-primary placeholder-tx-muted focus:outline-none font-sans"
              placeholder={`Mensaje en #${canal?.nombre || canalActivo}...`}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              disabled={sending}
              autoComplete="off"
            />
            <button type="submit" disabled={sending || !texto.trim()}
              className="px-3 py-2.5 text-tx-muted hover:text-accent-blue disabled:opacity-30 transition-colors shrink-0">
              <Send size={15}/>
            </button>
          </div>
          <p className="font-mono text-[7px] text-tx-dim mt-1.5 ml-1">Actualización automática cada 3s · Enter para enviar · 📷 para imagen</p>
        </form>
      </div>
    </div>
  )
}
