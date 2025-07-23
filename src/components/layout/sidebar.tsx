'use client'

import { 
  Upload, 
  Search, 
  FileImage, 
  History, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    id: 'upload',
    label: 'Upload',
    icon: Upload,
    description: 'Upload new X-ray images'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: Search,
    description: 'View and analyze measurements'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileImage,
    description: 'Generate and view reports'
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    description: 'View patient study history'
  }
] as const

const adminItems = [
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    description: 'Administrative dashboard'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Application settings'
  }
] as const

export function Sidebar() {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    activePanel, 
    setActivePanel,
    user 
  } = useAppStore()

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
              const isActive = activePanel === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-11 px-3",
                    sidebarCollapsed ? "px-0 justify-center" : "",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                      : "hover:bg-sidebar-accent text-sidebar-foreground"
                  )}
                  onClick={() => setActivePanel(item.id)}
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
                  const isActive = activePanel === item.id
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start h-11 px-3",
                        sidebarCollapsed ? "px-0 justify-center" : "",
                        isActive 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                          : "hover:bg-sidebar-accent text-sidebar-foreground"
                      )}
                      onClick={() => setActivePanel(item.id)}
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