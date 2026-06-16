import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList,
  FolderOpen, BarChart3, ChevronDown, ChevronRight, ScrollText,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useSidebar } from './AppLayout'
import { cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'
import PUPLogo from '../../Asset/PUP_LOGO.png'

type NavIcon = React.ComponentType<{ className?: string }>

interface SidebarGroupProps {
  label: string
  icon: NavIcon
  isOpen: boolean
  onToggle: () => void
  isCollapsed: boolean
  children: React.ReactNode
}

function SidebarGroup({ label, icon: Icon, isOpen, onToggle, isCollapsed, children }: SidebarGroupProps) {
  if (isCollapsed) {
    return (
      <div className="py-2 flex flex-col items-center">
        <button
          onClick={onToggle}
          title={label}
          className="p-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Icon className="h-5 w-5" />
        </button>
        {isOpen && (
          <div className="mt-1 flex flex-col gap-1 w-full items-center bg-black/10 py-1.5 rounded">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all group font-medium"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>{label}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="pl-6 pr-2 py-1 space-y-1 border-l border-white/10 ml-5 transition-all">
          {children}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar()

  // Dropdown states
  const [userMenuOpen, setUserMenuOpen] = useState(true)
  const [opcrMenuOpen, setOpcrMenuOpen] = useState(true)
  const [recordsMenuOpen, setRecordsMenuOpen] = useState(false)
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false)

  // Auto-expand/collapse dropdowns when location changes
  useEffect(() => {
    if (location.pathname.startsWith('/users')) {
      setUserMenuOpen(true)
    }
    if (location.pathname.startsWith('/transactions') || location.pathname.startsWith('/sla-review')) {
      setOpcrMenuOpen(true)
    }
  }, [location.pathname])

  const handleMockClick = (name: string) => {
    toast({
      title: 'ARMS Integrated Module',
      description: `${name} is managed exclusively by the Administrative & Records Management System (ARMS).`,
      variant: 'default',
    })
  }

  const renderLink = (to: string, label: string, icon: NavIcon | null = null, isMock = false) => {
    const Icon = icon

    const activeClass = "bg-[#7a0c0c] text-white font-semibold border-l-4 border-[#C8960C]"
    const inactiveClass = "text-white/70 hover:bg-white/10 hover:text-white"

    if (isMock) {
      return (
        <button
          onClick={() => handleMockClick(label)}
          className={cn(
            "flex w-full items-center text-left transition-all",
            isCollapsed
              ? "p-2 rounded-lg justify-center text-white/70 hover:bg-white/10 hover:text-white"
              : "gap-3 px-3 py-2 rounded-md text-xs font-medium " + inactiveClass
          )}
          title={isCollapsed ? label : undefined}
        >
          {Icon && <Icon className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-3.5 w-3.5")} />}
          {!isCollapsed && <span>{label}</span>}
        </button>
      )
    }

    return (
      <NavLink
        to={to}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) => cn(
          "flex items-center transition-all",
          isCollapsed
            ? "p-2.5 rounded-lg justify-center"
            : "gap-3 px-3 py-2 rounded-md text-sm font-medium",
          isActive ? activeClass : inactiveClass
        )}
        title={isCollapsed ? label : undefined}
      >
        {Icon && <Icon className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />}
        {!isCollapsed && <span>{label}</span>}
      </NavLink>
    )
  }

  return (
    <aside
      className={cn(
        "min-h-screen bg-[#580000] border-r border-[#4a0000] flex flex-col transition-all duration-300 z-40 relative shadow-xl shrink-0 text-white",
        // Desktop / Tablet Widths
        isCollapsed ? "w-16" : "w-64",
        // Mobile Drawer behavior
        "fixed md:static top-0 bottom-0 left-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Brand Header */}
      <div className={cn("h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0", isCollapsed ? "justify-center px-0" : "")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src={PUPLogo} alt="PUP Caloocan logo" className="w-full h-full object-contain filter brightness-110 drop-shadow" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="font-serif font-bold text-sm tracking-wide text-white leading-none">PUP Caloocan</p>
              <p className="text-[10px] text-white/50 font-medium leading-none mt-1">OPCR System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-none space-y-2">
        {/* MAIN Group */}
        {!isCollapsed ? (
  /* Inayos ko: ginawang text-yellow-500/70 (yellow na may 70% opacity) */
          <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-wider text-yellow-500/40 uppercase select-none">
            MAIN
          </div>
        ) : (
          <div className="border-t border-yellow-500/30 my-3" />
        )}

        {/* Dashboard Link */}
        {renderLink('/dashboard', 'Dashboard', LayoutDashboard)}

        {/* User Management Dropdown */}
        {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') && (
          <SidebarGroup
            label="User Management"
            icon={Users}
            isOpen={userMenuOpen}
            onToggle={() => setUserMenuOpen(!userMenuOpen)}
            isCollapsed={isCollapsed}
          >
            {renderLink('/users', 'Users')}
            {renderLink('/roles', 'Roles', null, true)}
            {renderLink('/permissions', 'Permissions', null, true)}
          </SidebarGroup>
        )}

        {/* OPCR Dropdown */}
        <SidebarGroup
          label="OPCR"
          icon={ClipboardList}
          isOpen={opcrMenuOpen}
          onToggle={() => setOpcrMenuOpen(!opcrMenuOpen)}
          isCollapsed={isCollapsed}
        >
          {renderLink('/sla-review', 'Evaluation Period')}
          {renderLink('/transactions', 'Transactions')}
        </SidebarGroup>

        {/* INSIGHTS Group */}
        {!isCollapsed ? (
  /* Inayos ko: ginawang text-yellow-500/70 (yellow na may 70% opacity) */
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-wider text-yellow-500/40 uppercase select-none">
              INSIGHTS
            </div>
          ) : (
            <div className="border-t border-yellow-500/30 my-3" />
          )}

        {/* Records Dropdown */}
        {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') && (
          <SidebarGroup
            label="Records"
            icon={FolderOpen}
            isOpen={recordsMenuOpen}
            onToggle={() => setRecordsMenuOpen(!recordsMenuOpen)}
            isCollapsed={isCollapsed}
          >
            {renderLink('/records/status', 'Documentary Status', null, true)}
            {renderLink('/records/reports', 'Documentary Reports', null, true)}
          </SidebarGroup>
        )}

        {/* Audit Log — EMS-026 (Admin & OPCR only) */}
        {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') && (
          renderLink('/audit-log', 'Audit Log', ScrollText)
        )}

        {/* Reports Dropdown */}
        <SidebarGroup
          label="Reports"
          icon={BarChart3}
          isOpen={reportsMenuOpen}
          onToggle={() => setReportsMenuOpen(!reportsMenuOpen)}
          isCollapsed={isCollapsed}
        >
          {renderLink('/reports/overview', 'Reports Overview', null, true)}
        </SidebarGroup>

        {/* Analytics Mock Link */}
        {renderLink('/analytics', 'Analytics', BarChart3, true)}
      </nav>

      {/* Sidebar Footer Branding */}
      {!isCollapsed && (
        <div className="mt-auto px-6 py-4 border-t border-white/10 text-xs font-semibold text-white/90 leading-normal select-none">
          Evaluation and Monitoring System
        </div>
      )}
    </aside>
  )
}