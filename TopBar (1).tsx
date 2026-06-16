import { useState, useRef, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, ChevronDown, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useSidebar } from './AppLayout'
import { cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BreadcrumbItem {
  label: string
  to: string
  active?: boolean
}

export function TopBar() {
  const { user, logout } = useAuth()
  const { isCollapsed, setCollapsed, isMobileOpen, setMobileOpen } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  // Dropdown visibility states
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Mock Notifications
  const notifications = [
    { id: 1, text: 'New transaction txn-108 created by Jose Reyes', time: '2 min ago' },
    { id: 2, text: 'SLA breach warning for transaction txn-102', time: '1 hour ago' },
    { id: 3, text: 'Documentary status updated for txn-99', time: '3 hours ago' },
  ]

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dynamic breadcrumb labels based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname
    const items: BreadcrumbItem[] = [{ label: 'Home', to: '/dashboard' }]

    if (path === '/dashboard') {
      return [{ label: 'Home', to: '/dashboard', active: true }]
    }

    if (path === '/users') {
      items.push({ label: 'User Management', to: '/users' })
      items.push({ label: 'Users', to: '/users' })
    } else if (path === '/transactions') {
      items.push({ label: 'OPCR', to: '/transactions' })
      items.push({ label: 'Transactions', to: '/transactions' })
    } else if (path.startsWith('/transactions/')) {
      items.push({ label: 'OPCR', to: '/transactions' })
      items.push({ label: 'Transactions', to: '/transactions' })
      items.push({ label: 'Detail', to: path })
    } else if (path === '/sla-review') {
      items.push({ label: 'OPCR', to: '/sla-review' })
      items.push({ label: 'Evaluation Period', to: '/sla-review' })
    } else {
      const parts = path.split('/').filter(Boolean)
      parts.forEach((part, index) => {
        const to = '/' + parts.slice(0, index + 1).join('/')
        const label = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ')
        items.push({ label, to })
      })
    }

    // Set the last element as active
    if (items.length > 0) {
      items[items.length - 1].active = true
    }

    return items
  }

  const handleSettingsClick = () => {
    setProfileOpen(false)
    toast({
      title: 'ARMS Settings Module',
      description: 'Account settings are managed via the central Administrative & Records Management System (ARMS).',
      variant: 'default',
    })
  }

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/login')
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 shadow-sm">
      {/* Left side: Hamburger Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setMobileOpen(!isMobileOpen)
            } else {
              setCollapsed(!isCollapsed)
            }
          }}
          className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden sm:flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.to} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-muted-foreground/40 font-semibold">&gt;</span>}
              {crumb.active ? (
                <span className="font-semibold text-[#580000]">{crumb.label}</span>
              ) : (
                <Link to={crumb.to} className="text-muted-foreground hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right side: Date Badge, Notifications & User Profile */}
      <div className="flex items-center gap-4">

        {/* Active Evaluation Period Badge */}

        <div className="hidden md:block">

          <span className="date-header font-bold">
            Jun 9, 2026 – Jun 10, 2026

          </span>

        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              "p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all relative",
              notifOpen && "bg-muted text-[#580000]"
            )}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#E24B4A] border-2 border-white animate-pulse" />
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl border border-border shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm text-[#580000]">Notifications</span>
                <span className="text-[10px] bg-[#EAF3DE] text-[#1D9E75] px-1.5 py-0.5 rounded-full font-bold">New</span>
              </div>
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0">
                    <p className="text-xs text-foreground font-medium">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted text-left transition-all"
          >
            {/* User initials / Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#580000] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block min-w-0 pr-1 select-none">
              <p className="text-xs font-semibold text-foreground leading-none truncate max-w-[120px]">
                {user?.name}
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-1 uppercase font-medium">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border shadow-xl py-2 z-50 overflow-hidden">
              {/* Dropdown Header */}
              <div className="px-4 py-2 bg-[#FCEBEB]/30 border-b border-border/80">
                <p className="text-xs font-bold text-[#580000] truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={handleSettingsClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-muted transition-colors font-medium"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    setShowLogoutConfirm(true)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[#E24B4A] hover:bg-[#FCEBEB] transition-colors font-medium border-t border-border/50"
                >
                  <LogOut className="h-4 w-4 text-[#E24B4A]" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Logout */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="modal-title text-[#580000]">Confirm Logout</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to log out of the OPCR System?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout} className="bg-[#E24B4A] text-white hover:bg-[#c93a3a]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
