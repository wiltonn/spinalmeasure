'use client'

import { usePathname } from 'next/navigation'
import { MainLayout } from './main-layout'

interface LayoutProviderProps {
  children: React.ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname()
  
  // Don't wrap the home page with MainLayout since it redirects
  if (pathname === '/') {
    return <>{children}</>
  }
  
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}