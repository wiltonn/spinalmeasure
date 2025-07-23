'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { MainLayout } from '@/components/layout/main-layout'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { UploadPage } from '@/components/pages/upload-page'
import { AnalysisPage } from '@/components/pages/analysis-page'

export default function Home() {
  const { activePanel, setUser } = useAppStore()

  // Mock user setup for demo
  useEffect(() => {
    setUser({
      id: '1',
      email: 'dr.smith@example.com',
      role: 'Radiologist',
      institutionId: 'inst-1'
    })
  }, [setUser])

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'upload':
        return <UploadPage />
      case 'analysis':
        return <AnalysisPage />
      case 'reports':
        return <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Reports</h2>
            <p className="text-muted-foreground">Report generation interface coming soon</p>
          </div>
        </div>
      case 'history':
        return <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Study History</h2>
            <p className="text-muted-foreground">Patient history interface coming soon</p>
          </div>
        </div>
      case 'admin':
        return <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Administration</h2>
            <p className="text-muted-foreground">Admin dashboard coming soon</p>
          </div>
        </div>
      default:
        return <DashboardPage />
    }
  }

  return (
    <MainLayout>
      {renderActivePanel()}
    </MainLayout>
  )
}
