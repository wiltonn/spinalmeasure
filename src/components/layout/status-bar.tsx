'use client'

import { Clock, Activity, Cpu, Wifi } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

export function StatusBar() {
  const { uploadQueue } = useAppStore()
  
  const activeUploads = uploadQueue.filter(f => f.status === 'uploading' || f.status === 'processing')
  const hasActivity = activeUploads.length > 0

  return (
    <div className="h-8 border-t border-border bg-muted/30 px-4 flex items-center justify-between text-xs text-muted-foreground">
      {/* Left side - Activity status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Activity className={cn(
            "h-3 w-3",
            hasActivity ? "text-medical-success animate-pulse" : ""
          )} />
          <span>
            {hasActivity 
              ? `Processing ${activeUploads.length} file${activeUploads.length > 1 ? 's' : ''}...`
              : 'Ready'
            }
          </span>
        </div>
        
        {hasActivity && (
          <div className="flex items-center space-x-2">
            {activeUploads.slice(0, 3).map((file) => (
              <div key={file.id} className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse" />
                <span className="truncate max-w-20">{file.file.name}</span>
                <span>({file.progress}%)</span>
              </div>
            ))}
            {activeUploads.length > 3 && (
              <span>+{activeUploads.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Right side - System status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Cpu className="h-3 w-3" />
          <span>AI Model: Ready</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Wifi className="h-3 w-3 text-medical-success" />
          <span>Connected</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}