'use client'

import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Target, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SeverityInfo {
  level: 'normal' | 'mild' | 'moderate' | 'severe'
  label: string
  range: string
  color: string
  description: string
}

const severityLevels: Record<string, SeverityInfo> = {
  normal: {
    level: 'normal',
    label: 'Normal',
    range: '< 10°',
    color: 'text-medical-success',
    description: 'No significant spinal curvature detected.'
  },
  mild: {
    level: 'mild',
    label: 'Mild Scoliosis',
    range: '10° - 25°',
    color: 'text-medical-warning',
    description: 'Mild spinal curvature. Monitoring recommended.'
  },
  moderate: {
    level: 'moderate',
    label: 'Moderate Scoliosis',
    range: '25° - 45°',
    color: 'text-orange-600',
    description: 'Moderate spinal curvature. Treatment may be required.'
  },
  severe: {
    level: 'severe',
    label: 'Severe Scoliosis',
    range: '> 45°',
    color: 'text-medical-danger',
    description: 'Severe spinal curvature. Immediate treatment recommended.'
  }
}

export function SidePanel() {
  const { currentStudy, measurements } = useAppStore()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'measurements'])
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  if (!currentStudy) {
    return (
      <div className="w-80 border-l border-border bg-card/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground p-6">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6" />
          </div>
          <p className="text-sm">No study selected</p>
        </div>
      </div>
    )
  }

  const studyMeasurements = measurements.filter(m => m.studyId === currentStudy.id)
  const maxAngle = Math.max(...studyMeasurements.map(m => m.angleValue), 0)
  const severityInfo = severityLevels[currentStudy.severity] || severityLevels.normal

  const SectionHeader = ({ 
    id, 
    title, 
    icon: Icon 
  }: { 
    id: string
    title: string
    icon: React.ComponentType<{ className?: string }> 
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg"
    >
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{title}</span>
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )

  return (
    <div className="w-80 border-l border-border bg-card/30 flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Analysis Results</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Study ID: {currentStudy.id.slice(0, 8)}...
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary Section */}
        <div className="space-y-2">
          <SectionHeader id="summary" title="Summary" icon={Target} />
          
          {expandedSections.has('summary') && (
            <div className="space-y-4 pl-6">
              {/* Severity Classification */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Classification</span>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    severityInfo.level === 'normal' && "bg-medical-success/10 text-medical-success",
                    severityInfo.level === 'mild' && "bg-medical-warning/10 text-medical-warning",
                    severityInfo.level === 'moderate' && "bg-orange-100 text-orange-700",
                    severityInfo.level === 'severe' && "bg-medical-danger/10 text-medical-danger"
                  )}>
                    {severityInfo.label}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Angle:</span>
                    <span className="font-mono font-medium">{maxAngle.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Range:</span>
                    <span className="font-mono">{severityInfo.range}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  {severityInfo.description}
                </p>
              </div>

              {/* Processing Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-medical-success" />
                  <span className="text-medical-success">Complete</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processed:</span>
                <span className="font-mono text-xs">
                  {new Date(currentStudy.uploadTimestamp).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Measurements Section */}
        <div className="space-y-2">
          <SectionHeader id="measurements" title="Measurements" icon={TrendingUp} />
          
          {expandedSections.has('measurements') && (
            <div className="space-y-3 pl-6">
              {studyMeasurements.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No measurements available</p>
                </div>
              ) : (
                studyMeasurements.map((measurement) => (
                  <div 
                    key={measurement.id}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium capitalize",
                        measurement.curveType === 'primary' ? "text-blue-600" : "text-green-600"
                      )}>
                        {measurement.curveType} Curve
                      </span>
                      <div className="flex items-center space-x-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          measurement.confidence >= 90 ? "bg-medical-success" :
                          measurement.confidence >= 70 ? "bg-medical-warning" : "bg-medical-danger"
                        )} />
                        <span className="text-xs text-muted-foreground">
                          {measurement.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Angle:</span>
                        <span className="font-mono font-semibold">
                          {measurement.angleValue.toFixed(1)}°
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-mono">
                          v{measurement.modelVersion}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Detected:</span>
                        <span className="font-mono">
                          {new Date(measurement.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-2">
          <SectionHeader id="history" title="Study History" icon={Clock} />
          
          {expandedSections.has('history') && (
            <div className="space-y-2 pl-6">
              <div className="text-center text-muted-foreground py-4">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No previous studies</p>
                <p className="text-xs mt-1">
                  Previous studies will appear here for comparison
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button 
          variant="medical" 
          className="w-full"
          disabled={studyMeasurements.length === 0}
        >
          Generate Report
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full"
          disabled={studyMeasurements.length === 0}
        >
          Export Data
        </Button>
      </div>
    </div>
  )
}