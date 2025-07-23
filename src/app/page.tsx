'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

export default function Home() {
  const { setUser } = useAppStore()
  const router = useRouter()

  // Mock user setup for demo and redirect to dashboard
  useEffect(() => {
    setUser({
      id: '1',
      email: 'dr.smith@example.com',
      role: 'Radiologist',
      institutionId: 'inst-1'
    })
    
    // Redirect to dashboard
    router.push('/dashboard')
  }, [setUser, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
