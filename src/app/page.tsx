'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Lock, ChevronRight, Shield, Globe } from 'lucide-react'

const TIPO_TAG: Record<string,string> = {
  operativo: 'tag border-blue-700/50 bg-blue-900/20 text-blue-400',
  informe:   'tag border-yellow-700/50 bg-yellow-900/10 text-yellow-500',
}

function PublicOps() {
  const [ops, setOps] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/operativos?publica=1&tipo=').then(r=>r.json()).then(d=>setOps(Array.isArray(d)?d.slice(0,6):[])).catch(()=>{})
  }, [])
  if (ops.length === 0) return (
    <div className="card p-10 text-center">
      <p className="font-mono text-xs text-tx-muted tracking-widest uppercase">Sin publicaciones recientes</p>
    </div>
  )
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {ops.map(op => (
        <div key={op.id} className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={TIPO_TAG[op.tipo]||''}>{op.tipo}</span>
            <span className="font-mono text-[8px] text-tx-muted uppercase">{op.unidad}</span>
          </div>
          <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-tx-primary leading-tight mb-1">{op.titulo}</h3>
          {op.descripcion && <p className="text-xs text-tx-secondary line-clamp-2">{op.descripcion}</p>}
          <p className="font-mono text-[8px] text-tx-muted mt-2">{new Date(op.creadoEn).toLocaleDateString('es')} · {op.nombreAutor}</p>
        </div>
      ))}
    </div>
  )
}

const UNITS = [
  { name:'CIRG',       logo:'https://i.imgur.com/QKAp6O1.png', desc:'Critical Incident Response Group' },
  { name:'ERT',        logo:'https://i.imgur.com/IemqOQh.png', desc:'Evidence Response Team' },
  { name:'RRHH',       logo:'https://i.imgur.com/z5NiemF.png', desc:'Recursos Humanos' },
  { name:'CIRG: SWT',  logo:'https://i.imgur.com/BYWtnQH.png', desc:'Special Weapons & Tactics' },
  { name:'CIRG: UC',   logo:'https://i.imgur.com/wUqoxAe.png', desc:'Undercover Operations' },
  { name:'VCTF',       logo:'https://i.imgur.com/YygbJGY.png', desc:'Violent Crimes Task Force' },
  { name:'Task Force', logo:'https://i.imgur.com/xgJr3Ud.png', desc:'Joint Task Force' },
  { name:'SOG',        logo:'https://i.imgur.com/ec6o9jW.png', desc:'Special Operations Group' },
]

const RANKS = [
  { section:'Command Staff',    color:'border-red-700',       ranks:['Director','Sub Director'] },
  { section:'Jefatura',         color:'border-accent-gold',   ranks:['Coordinador','Jefe de Personal'] },
  { section:'Supervisory',      color:'border-accent-blue',   ranks:['Supervisor','Special Agent Senior'] },
  { section:'Agentes Federales',color:'border-bg-border',     ranks:['Special Agent III','Special Agent II','Special Agent I','Training Agent'] },
]

function Ticker() {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setInterval(() => setOn(v => !v), 1100); return () => clearInterval(t) }, [])
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest">
      <span className={`text-red-500 transition-opacity duration-200 ${on?'opacity-100':'opacity-20'}`}>██ CLASIFICADO</span>
      <span className="text-tx-muted">|</span><span className="text-tx-muted">ACCESO RESTRINGIDO</span><span className="text-tx-muted">|</span>
      <span className={`text-red-500 transition-opacity duration-200 ${on?'opacity-20':'opacity-100'}`}>NIVEL ALFA</span>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-bg-border/0 hover:border-bg-border bg-bg-base/0 hover:bg-bg-base/90 transition-all duration-300 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="https://i.imgur.com/EAimMhx.png" alt="FIB" width={28} height={28} className="opacity-80" />
            <div>
              <p className="font-display text-xs font-semibold tracking-widest uppercase text-tx-primary leading-none">Federal Investigation Bureau</p>
              <p className="font-mono text-[8px] text-tx-muted tracking-widest">HQ SYSTEM</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['unidades','rangos','mision'].map(s => (
              <a key={s} href={`#${s}`} className="font-display text-[10px] tracking-widest uppercase text-tx-muted hover:text-tx-primary transition-colors">{s}</a>
            ))}
          </div>
          <Link href="/login">
            <button className="flex items-center gap-1.5 border border-accent-blue/40 hover:border-accent-blue hover:bg-accent-blue/10 text-accent-blue font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all">
              <Lock size={10} />Acceso Interno
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A2535' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zm39 0h1v40h-1zM0 0v1h40V0zm0 39v1h40v-1z'/%3E%3C/g%3E%3C/svg%3E\")"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent-blue/5 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-accent-blue/20 to-transparent animate-scan" />
        </div>
        {(['top-8 left-8','top-8 right-8','bottom-8 left-8','bottom-8 right-8'] as const).map((pos,i) => (
          <div key={i} className={`absolute ${pos} w-7 h-7 opacity-20`}>
            <div className={`absolute w-full h-px bg-accent-blue ${i<2?'top-0':'bottom-0'}`} />
            <div className={`absolute h-full w-px bg-accent-blue ${i%2===0?'left-0':'right-0'}`} />
          </div>
        ))}

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl animate-fade-up">
          <div className="mb-6"><Ticker /></div>
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-2xl bg-accent-blue/10 rounded-full scale-150" />
            <Image src="https://i.imgur.com/naw30N7.png" alt="FIB" width={130} height={130} className="relative z-10 drop-shadow-2xl" />
          </div>
          <p className="font-mono text-accent-cyan text-[10px] tracking-[0.4em] uppercase mb-3">Department of Justice</p>
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-wider text-tx-primary uppercase leading-none">Federal</h1>
          <h1 className="font-display text-6xl md:text-8xl font-light tracking-wider text-tx-secondary uppercase leading-none mb-2">Investigation Bureau</h1>
          <div className="flex items-center gap-4 my-5">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent-blue" />
            <span className="font-mono text-accent-gold text-[10px] tracking-[0.3em] uppercase">HQ Operations Center</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent-blue" />
          </div>
          <p className="text-tx-secondary text-sm max-w-lg leading-relaxed mb-8">Sistema centralizado de gestión operativa. Personal, investigaciones, allanamientos y recursos internos.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login"><button className="btn-primary"><Lock size={12} />Acceso al Sistema<ChevronRight size={12} /></button></Link>
            <a href="#unidades"><button className="btn-ghost"><Globe size={12} />Ver División</button></a>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <span className="font-mono text-[9px] tracking-widest text-tx-muted">SCROLL</span>
          <div className="w-px h-6 bg-gradient-to-b from-tx-muted to-transparent" />
        </div>
      </section>

      {/* Operativos Públicos */}
      <section className="py-20 px-6 bg-bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="section-tag">// Actividad Reciente</span>
              <div className="divider" />
              <h2 className="font-display text-3xl font-semibold tracking-wider uppercase text-tx-primary">Operativos e Informes</h2>
            </div>
            <Link href="/login"><button className="btn-ghost py-2 text-[9px]"><Lock size={10}/>Ver todo</button></Link>
          </div>
          <PublicOps />
        </div>
      </section>

      {/* Unidades */}
      <section id="unidades" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="section-tag">// Unidades Especializadas</span>
            <div className="divider" />
            <h2 className="font-display text-3xl font-semibold tracking-wider uppercase text-tx-primary">Grupos Operativos</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-bg-border">
            {UNITS.map(u => (
              <div key={u.name} className="group bg-bg-card hover:bg-bg-hover transition-all duration-300 p-7 flex flex-col items-center gap-3">
                <div className="relative w-16 h-16">
                  <Image src={u.logo} alt={u.name} fill className="object-contain grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-500" />
                </div>
                <div className="text-center">
                  <p className="font-display text-xs font-semibold tracking-widest uppercase text-tx-primary group-hover:text-accent-blue transition-colors">{u.name}</p>
                  <p className="font-mono text-[9px] text-tx-muted mt-0.5">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rangos */}
      <section id="rangos" className="py-28 px-6 bg-bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="section-tag">// Jerarquía Institucional</span>
            <div className="divider" />
            <h2 className="font-display text-3xl font-semibold tracking-wider uppercase text-tx-primary">Estructura de Rangos</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-px bg-bg-border">
            {RANKS.map(s => (
              <div key={s.section} className={`bg-bg-card border-t-2 ${s.color} p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={13} className="text-tx-muted" />
                  <h3 className="font-display text-xs font-semibold tracking-widest uppercase text-tx-primary">{s.section}</h3>
                </div>
                {s.ranks.map((r,i) => (
                  <div key={r} className="flex items-center justify-between py-1.5 border-b border-bg-border last:border-0">
                    <span className="text-xs text-tx-secondary">{r}</span>
                    <span className="font-mono text-[9px] text-tx-muted">{String(i+1).padStart(2,'0')}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mision" className="py-28 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="section-tag">// Declaración Institucional</span>
            <div className="divider" />
            <h2 className="font-display text-3xl font-semibold tracking-wider uppercase text-tx-primary mb-5">Misión y Valores</h2>
            <p className="text-tx-secondary text-sm leading-relaxed mb-7">La FIB es la principal agencia de inteligencia e investigación federal. Protegemos el estado de derecho mediante operaciones encubiertas, investigación criminal avanzada y coordinación inter-divisional.</p>
            <Link href="/login"><button className="btn-primary"><Lock size={12} />Ingresar al Sistema<ChevronRight size={12} /></button></Link>
          </div>
          <div className="relative border border-bg-border overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />
            <Image src="https://i.imgur.com/7NxeszI.png" alt="FIB Gala" width={600} height={400} className="w-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-bg-base/80 to-transparent p-4">
              <p className="font-mono text-[9px] text-tx-muted tracking-widest uppercase">FIB — Gala Institucional</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bg-border py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="https://i.imgur.com/EAimMhx.png" alt="FIB" width={18} height={18} className="opacity-30" />
            <span className="font-mono text-[9px] text-tx-muted tracking-widest uppercase">Federal Investigation Bureau © 2024 — All Rights Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="font-mono text-[9px] text-accent-green tracking-widest">SYSTEMS ONLINE</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
