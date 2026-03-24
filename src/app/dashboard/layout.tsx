'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FolderOpen, Car, FileSearch, Ticket, MessageSquare, FolderArchive, Shield, Settings, LogOut, Menu, X, Bell, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() / 1000 > payload.exp
  } catch { return true }
}

const NAV_GROUPS = [
  { label:'Principal', items:[
    { icon:LayoutDashboard, label:'Inicio',    href:'/dashboard' },
    { icon:Users,           label:'Personal',  href:'/dashboard/personal' },
  ]},
  { label:'Operaciones', items:[
    { icon:Shield,       label:'Operativos',    href:'/dashboard/operativos' },
    { icon:FolderOpen,   label:'Casos',         href:'/dashboard/casos' },
    { icon:FileSearch,   label:'Allanamientos', href:'/dashboard/allanamientos' },
    { icon:Ticket,       label:'Tickets',       href:'/dashboard/tickets' },
  ]},
  { label:'Personal', items:[
    { icon:MessageSquare, label:'Chat',    href:'/dashboard/chat' },
    { icon:FolderArchive, label:'Carpeta', href:'/dashboard/carpeta' },
  ]},
  { label:'Administración', items:[
    { icon:Shield,   label:'Admin',         href:'/dashboard/admin' },
    { icon:Settings, label:'Configuración', href:'/dashboard/config' },
  ]},
]

function canSeeNavItem(rol: string, href: string) {
  if (rol === 'command_staff') return true
  if (rol === 'supervisory') {
    if (href === '/dashboard/config') return false
    return true
  }
  if (rol === 'federal_agent') {
    if (href === '/dashboard/admin' || href === '/dashboard/config') return false
    return true
  }
  if (rol === 'visitante') {
    return href === '/dashboard' || href === '/dashboard/chat'
  }
  return false
}

const ROL_COLOR: Record<string,string> = {
  command_staff: 'text-red-400',
  supervisory:   'text-blue-400',
  federal_agent: 'text-green-400',
  visitante:     'text-gray-400',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [showNotifDot, setShowNotifDot] = useState(false)
  const pathname = usePathname()
  const { theme } = useTheme()
  const pollingRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // Check token and load user
  useEffect(() => {
    const token = localStorage.getItem('fib_token')
    if (!token || isTokenExpired(token)) {
      localStorage.clear()
      window.location.href = '/login'
      return
    }
    const u = localStorage.getItem('fib_user')
    if (u) setUser(JSON.parse(u))
  }, [])

  // Periodic token validity check (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('fib_token')
      if (!token || isTokenExpired(token)) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Notification polling: check for pending tickets + allanamientos every 30s
  const pollNotifications = useCallback(async () => {
    const token = localStorage.getItem('fib_token')
    if (!token) return
    try {
      const [ticketsRes, allRes] = await Promise.all([
        fetch('/api/tickets?estado=abierto', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/allanamientos?estado=pendiente', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const tickets = ticketsRes.ok ? await ticketsRes.json() : []
      const alls    = allRes.ok    ? await allRes.json()    : []
      const count   = (Array.isArray(tickets) ? tickets.length : 0) + (Array.isArray(alls) ? alls.length : 0)
      setNotifCount(count)
      setShowNotifDot(count > 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    pollNotifications()
    pollingRef.current = setInterval(pollNotifications, 30_000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [pollNotifications])

  // Reset dot when visiting tickets or allanamientos
  useEffect(() => {
    if (pathname.includes('tickets') || pathname.includes('allanamientos')) {
      setShowNotifDot(false)
    }
  }, [pathname])

  const logout = () => { localStorage.clear(); window.location.href = '/login' }

  const sidebarStyle = {
    backgroundColor: theme.sidebarColor,
    color: theme.sidebarTextColor,
  }
  const accentStyle = { color: theme.accentColor }
  const accentBg    = { backgroundColor: `${theme.accentColor}18`, borderColor: theme.accentColor }

  return (
    <div className="min-h-screen bg-bg-base flex">
      {open && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={()=>setOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-56 border-r border-bg-border z-50 flex flex-col transition-transform duration-200 ${open?'translate-x-0':'-translate-x-full md:translate-x-0'}`} style={sidebarStyle}>
        {/* Logo */}
        <div className="h-13 flex items-center gap-2.5 px-4 py-3 border-b border-white/10 shrink-0">
          <Image src={theme.logoUrl||'https://i.imgur.com/EAimMhx.png'} alt="Logo" width={22} height={22} className="opacity-80 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs font-semibold tracking-widest uppercase truncate" style={{color:theme.sidebarTextColor}}>{theme.divisionName?.split(' ').slice(0,2).join(' ')||'FIB HQ'}</p>
            <p className="font-mono text-[7px] tracking-widest opacity-50" style={{color:theme.sidebarTextColor}}>SISTEMA INTERNO</p>
          </div>
          <button onClick={()=>setOpen(false)} className="md:hidden opacity-60 hover:opacity-100 shrink-0"><X size={13}/></button>
        </div>

        {/* User */}
        {user && (
          <div className="px-3 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[10px] font-bold uppercase" style={{...accentBg, borderWidth:'1px', borderStyle:'solid'}}>
                <span style={accentStyle}>{user.username?.[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[10px] font-semibold tracking-wider uppercase truncate" style={{color:theme.sidebarTextColor}}>{user.username}</p>
                <p className={`font-mono text-[7px] tracking-widest uppercase ${ROL_COLOR[user.rol]||''}`}>{user.rol?.replace('_',' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(item => canSeeNavItem(user?.rol, item.href))
            if (visibleItems.length === 0) return null
            return (
            <div key={group.label} className="mb-1">
              <p className="px-4 py-1.5 font-mono text-[7px] tracking-widest uppercase opacity-30" style={{color:theme.sidebarTextColor}}>{group.label}</p>
              {visibleItems.map(item => {
                const active = pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>
                    <div className={`flex items-center gap-2.5 px-4 py-2 transition-all cursor-pointer`}
                      style={active ? { ...accentBg, borderRight:`2px solid ${theme.accentColor}` } : { color:theme.sidebarTextColor, opacity:0.65 }}>
                      <item.icon size={13} className="shrink-0" style={active?accentStyle:{}}/>
                      <span className="font-display text-[10px] tracking-wider uppercase" style={active?accentStyle:{}}>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )})}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-1.5 opacity-50 hover:opacity-100 hover:text-red-400 transition-all" style={{color:theme.sidebarTextColor}}>
            <LogOut size={12}/>
            <span className="font-mono text-[9px] tracking-widest uppercase">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* Topbar */}
        <header className="h-12 bg-bg-card border-b border-bg-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={()=>setOpen(true)} className="md:hidden text-tx-muted hover:text-tx-primary"><Menu size={16}/></button>
            <div className="hidden md:flex items-center gap-1 font-mono text-[9px] text-tx-muted">
              <span style={{color:theme.accentColor}}>FIB HQ</span>
              <ChevronRight size={8}/>
              <span className="text-tx-secondary capitalize">{pathname.split('/').filter(Boolean).slice(1).join(' / ')||'inicio'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:theme.accentColor}}/>
              <span className="font-mono text-[8px] tracking-widest" style={{color:theme.accentColor}}>ONLINE</span>
            </div>
            <button className="relative text-tx-muted hover:text-tx-primary transition-colors" title={notifCount > 0 ? `${notifCount} pendiente(s)` : 'Sin pendientes'}>
              <Bell size={14}/>
              {showNotifDot && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center text-[7px] font-bold rounded-full" style={{ backgroundColor: theme.accentColor, color: '#000' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dashboard background */}
        <div className="flex-1 relative overflow-auto">
          {theme.dashboardBgUrl && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <img src={theme.dashboardBgUrl} alt="" className="w-full h-full object-cover opacity-5"/>
            </div>
          )}

          <div className="relative z-10 p-5 flex flex-col gap-4 min-h-full">
            {/* Welcome banner */}
            {theme.welcomeEnabled && theme.welcomeBanner && (
              <div className="px-4 py-3 border-l-2 text-sm" style={{borderColor:theme.accentColor, backgroundColor:`${theme.accentColor}10`}}>
                <p className="font-mono text-[9px] uppercase mb-0.5" style={{color:theme.accentColor}}>Aviso</p>
                <p className="text-tx-secondary text-xs">{theme.welcomeBanner}</p>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
