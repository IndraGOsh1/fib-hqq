'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Users, FolderOpen, FileSearch, Ticket, TrendingUp, Shield, ChevronRight } from 'lucide-react'
import { getStats } from '@/lib/client'

export default function DashboardHome() {
  const [user,  setUser]  = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('fib_user')
    if (u) setUser(JSON.parse(u))
    getStats().then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { icon: Users,       label:'Agentes Activos',   value: stats?.activos    ?? '—', color:'text-accent-green', href:'/dashboard/personal?estado=Activo' },
    { icon: TrendingUp,  label:'Total Personal',     value: stats?.total      ?? '—', color:'text-accent-blue',  href:'/dashboard/personal' },
    { icon: FolderOpen,  label:'Casos Abiertos',     value:'—',                       color:'text-accent-cyan',  href:'/dashboard/casos' },
    { icon: FileSearch,  label:'Allanamientos',      value:'—',                       color:'text-accent-gold',  href:'/dashboard/allanamientos' },
  ]

  const QUICK = [
    { icon: Users,       label:'Personal',       href:'/dashboard/personal',     desc:'Gestión de agentes' },
    { icon: FolderOpen,  label:'Casos',          href:'/dashboard/casos',         desc:'Investigaciones' },
    { icon: FileSearch,  label:'Allanamientos',  href:'/dashboard/allanamientos', desc:'Solicitudes y PDFs' },
    { icon: Ticket,      label:'Tickets',        href:'/dashboard/tickets',       desc:'Solicitudes internas' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <span className="section-tag">// Panel de Control</span>
        <h1 className="font-display text-2xl font-semibold tracking-wider uppercase text-tx-primary mt-1">
          Bienvenido{user?.nombre ? `, ${user.nombre}` : user?.username ? `, ${user.username}` : ''}
        </h1>
        <p className="text-tx-secondary text-sm mt-0.5">Federal Investigation Bureau — Sistema HQ</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-bg-border mb-5">
        {STAT_CARDS.map(c => (
          <Link key={c.label} href={c.href}>
            <div className="bg-bg-card hover:bg-bg-hover transition-all p-5 group cursor-pointer">
              <c.icon size={16} className={`${c.color} mb-3 group-hover:scale-110 transition-transform`} />
              <p className="font-display text-2xl font-semibold text-tx-primary">{loading ? '—' : c.value}</p>
              <p className="font-mono text-[8px] text-tx-muted tracking-widest uppercase mt-1">{c.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Por sección */}
      {stats?.porSeccion && Object.keys(stats.porSeccion).length > 0 && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="section-tag">// Distribución de Personal Activo</span>
            <div className="flex-1 h-px bg-bg-border" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.porSeccion).map(([sec, count]) => (
              <div key={sec} className="bg-bg-surface border border-bg-border p-3">
                <p className="font-display text-xl font-semibold text-accent-blue">{count as number}</p>
                <p className="font-mono text-[8px] text-tx-muted tracking-widest uppercase mt-0.5">{sec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick access */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="section-tag">// Acceso Rápido</span>
          <div className="flex-1 h-px bg-bg-border" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-bg-border">
          {QUICK.map(q => (
            <Link key={q.label} href={q.href}>
              <div className="bg-bg-surface hover:bg-bg-hover transition-all p-5 group cursor-pointer">
                <q.icon size={15} className="text-tx-muted group-hover:text-accent-blue transition-colors mb-2.5" />
                <p className="font-display text-xs font-semibold tracking-wider uppercase text-tx-primary">{q.label}</p>
                <p className="font-mono text-[8px] text-tx-muted mt-1">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
