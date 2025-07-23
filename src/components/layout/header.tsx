'use client'

import { Bell, Settings } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, notifications } = useAppStore()
  const router = useRouter()
  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleNotificationsClick = () => {
    // TODO: Open notifications panel or navigate to notifications page
    console.log('Notifications clicked')
  }

  const handleSettingsClick = () => {
    router.push('/settings')
  }


  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-medical-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">SpineMeasure</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={handleNotificationsClick}
            aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-medical-danger text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-2 pl-2 border-l border-border">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || 'Unknown Role'}
                </p>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}