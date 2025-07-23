'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface ProcessingStage {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const processingStages: ProcessingStage[] = [
  {
    id: 'upload',
    label: 'Upload',
    description: 'Uploading files to server',
    icon: Zap
  },
  {
    id: 'validation',
    label: 'Validation',
    description: 'Checking image quality and format',
    icon: CheckCircle
  },
  {
    id: 'ai-processing',
    label: 'AI Analysis',
    description: 'Detecting vertebrae and measuring Cobb angles',
    icon: Zap
  }
]

export function ProcessingFeedback() {
  const { uploadQueue } = useAppStore()
  const [currentStage, setCurrentStage] = useState<string>('upload')
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [startTime] = useState<Date>(new Date())

  const activeFiles = uploadQueue.filter(f => 
    f.status === 'uploading' || f.status === 'validating' || f.status === 'processing'
  )

  // Determine current processing stage
  useEffect(() => {
    const hasUploading = activeFiles.some(f => f.status === 'uploading')
    const hasValidating = activeFiles.some(f => f.status === 'validating')
    const hasProcessing = activeFiles.some(f => f.status === 'processing')

    if (hasUploading) {
      setCurrentStage('upload')
    } else if (hasValidating) {
      setCurrentStage('validation')
    } else if (hasProcessing) {
      setCurrentStage('ai-processing')
    }
  }, [activeFiles])

  // Estimate processing time
  useEffect(() => {
    const totalFiles = activeFiles.length
    if (totalFiles > 0) {
      // Rough estimate: 30-60 seconds per file for AI processing
      const baseTime = totalFiles * 45 // 45 seconds average
      const randomVariation = Math.random() * 30 - 15 // ±15 seconds
      setEstimatedTime(Math.max(30, baseTime + randomVariation))
    }
  }, [activeFiles.length])

  // Calculate overall progress
  const overallProgress = activeFiles.length > 0 
    ? activeFiles.reduce((acc, file) => acc + file.progress, 0) / activeFiles.length
    : 0

  const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
  const remainingTime = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : null

  if (activeFiles.length === 0) return null

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Processing Files</h3>
        <div className="text-sm text-muted-foreground">
          {activeFiles.length} file{activeFiles.length > 1 ? 's' : ''} remaining
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="h-3 bg-medical-primary rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Processing Stages */}
      <div className="space-y-4 mb-6">
        {processingStages.map((stage, index) => {
          const isActive = stage.id === currentStage
          const isCompleted = processingStages.findIndex(s => s.id === currentStage) > index
          const Icon = stage.icon

          return (
            <div key={stage.id} className="flex items-center space-x-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isActive && "bg-medical-primary text-white animate-pulse",
                isCompleted && "bg-medical-success text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-foreground">{stage.label}</div>
                <div className={cn(
                  "text-sm transition-colors",
                  isActive ? "text-medical-primary" : "text-muted-foreground"
                )}>
                  {stage.description}
                </div>
              </div>

              {isActive && (
                <div className="text-sm font-medium text-medical-primary">
                  Active
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Time Estimates */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>Elapsed: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</span>
        </div>
        
        {remainingTime !== null && (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              Est. remaining: {Math.floor(remainingTime / 60)}m {Math.round(remainingTime % 60)}s
            </span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="mt-4 space-y-2">
        {activeFiles.slice(0, 3).map((file) => (
          <div key={file.id} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-4">
              {file.file.name}
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse" />
              <span className="text-medical-primary font-medium">
                {file.progress}%
              </span>
            </div>
          </div>
        ))}
        
        {activeFiles.length > 3 && (
          <div className="text-sm text-muted-foreground text-center pt-2">
            +{activeFiles.length - 3} more files processing...
          </div>
        )}
      </div>
    </div>
  )
}