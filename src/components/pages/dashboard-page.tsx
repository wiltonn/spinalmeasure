'use client'

import { 
  Upload,
  FileImage,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  change?: string
  trend?: 'up' | 'down' | 'stable'
}

export function DashboardPage() {
  const router = useRouter()
  const { user, uploadQueue } = useAppStore()

  const handleUploadClick = () => {
    router.push('/upload')
  }

  const handleViewReportsClick = () => {
    router.push('/reports')
  }

  const handleAnalyticsClick = () => {
    router.push('/analytics')
  }

  const stats: StatCard[] = [
    {
      label: 'Studies Today',
      value: '12',
      icon: FileImage,
      change: '+8%',
      trend: 'up'
    },
    {
      label: 'Average Accuracy',
      value: '94.2%',
      icon: TrendingUp,
      change: '+2.1%',
      trend: 'up'
    },
    {
      label: 'Processing Time',
      value: '1.4m',
      icon: Clock,
      change: '-12%',
      trend: 'down'
    },
    {
      label: 'Active Users',
      value: '28',
      icon: Users,
      change: '+5',
      trend: 'up'
    }
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'upload',
      message: 'New X-ray uploaded by Dr. Smith',
      timestamp: '2 minutes ago',
      status: 'processing'
    },
    {
      id: '2',
      type: 'analysis',
      message: 'Cobb angle analysis completed - 23.4°',
      timestamp: '5 minutes ago', 
      status: 'completed'
    },
    {
      id: '3',
      type: 'report',
      message: 'PDF report generated for Patient #1847',
      timestamp: '12 minutes ago',
      status: 'completed'
    },
    {
      id: '4',
      type: 'alert',
      message: 'High severity case detected - 47.2°',
      timestamp: '18 minutes ago',
      status: 'alert'
    }
  ]

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-medical-success'
      case 'down': return 'text-medical-danger'
      default: return 'text-medical-neutral'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return Upload
      case 'analysis': return TrendingUp
      case 'report': return FileImage
      case 'alert': return AlertTriangle
      default: return FileImage
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-medical-warning'
      case 'completed': return 'text-medical-success'
      case 'alert': return 'text-medical-danger'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.email || 'User'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your spine analysis system today.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleViewReportsClick}>
              View Reports
            </Button>
            <Button variant="medical" onClick={handleUploadClick}>
              Upload New Study
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                      {stat.change && (
                        <p className={cn(
                          "text-sm mt-1 flex items-center space-x-1",
                          getTrendColor(stat.trend)
                        )}>
                          <span>{stat.change}</span>
                          <span className="text-muted-foreground">vs last week</span>
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-medical-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-medical-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activities and processing updates
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        activity.status === 'processing' && "bg-medical-warning/10",
                        activity.status === 'completed' && "bg-medical-success/10",
                        activity.status === 'alert' && "bg-medical-danger/10"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4",
                          getActivityColor(activity.status)
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Model</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-medical-success rounded-full" />
                  <span className="text-sm font-medium text-medical-success">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-medical-success rounded-full" />
                  <span className="text-sm font-medium text-medical-success">Healthy</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-medical-warning rounded-full" />
                  <span className="text-sm font-medium text-medical-warning">78% Used</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processing Queue</span>
                <span className="text-sm font-medium text-foreground">
                  {uploadQueue.filter(f => f.status === 'processing').length} files
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2" onClick={handleUploadClick}>
              <Upload className="w-6 h-6" />
              <span>Upload New Study</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2" onClick={handleViewReportsClick}>
              <FileImage className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2" onClick={handleAnalyticsClick}>
              <TrendingUp className="w-6 h-6" />
              <span>Analytics</span>
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}