'use client'

import { 
  Upload, 
  Search, 
  FileImage, 
  History, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    description: 'Main dashboard overview'
  },
  {
    id: 'upload',
    label: 'Upload',
    icon: Upload,
    href: '/upload',
    description: 'Upload new X-ray images'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: Search,
    href: '/analysis',
    description: 'View and analyze measurements'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileImage,
    href: '/reports',
    description: 'Generate and view reports'
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    href: '/history',
    description: 'View patient study history'
  }
] as const

const adminItems = [
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    href: '/admin',
    description: 'Administrative dashboard'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'Application settings'
  }
] as const

export function Sidebar() {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed,
    user 
  } = useAppStore()

  const pathname = usePathname()
  const isAdmin = user?.role === 'Admin'

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 hover:bg-sidebar-accent"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-11 px-3",
                      sidebarCollapsed ? "px-0 justify-center" : "",
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                        : "hover:bg-sidebar-accent text-sidebar-foreground"
                    )}
                    aria-label={sidebarCollapsed ? `${item.label}: ${item.description}` : undefined}
                    title={sidebarCollapsed ? item.description : undefined}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      sidebarCollapsed ? "" : "mr-3"
                    )} />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-8">
              {!sidebarCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                  Administration
                </h3>
              )}
              <div className="space-y-2">
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link key={item.id} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start h-11 px-3",
                          sidebarCollapsed ? "px-0 justify-center" : "",
                          isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                            : "hover:bg-sidebar-accent text-sidebar-foreground"
                        )}
                        aria-label={sidebarCollapsed ? `${item.label}: ${item.description}` : undefined}
                        title={sidebarCollapsed ? item.description : undefined}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          sidebarCollapsed ? "" : "mr-3"
                        )} />
                        {!sidebarCollapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  )
}