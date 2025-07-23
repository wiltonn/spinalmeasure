'use client'

import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2,
  Sun,
  Contrast,
  Eye,
  EyeOff,
  Ruler
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export function ViewerControls() {
  const { viewerConfig, updateViewerConfig, resetViewerConfig } = useAppStore()

  const handleZoomIn = () => {
    const newZoom = Math.min(5, viewerConfig.zoom * 1.2)
    updateViewerConfig({ zoom: newZoom })
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, viewerConfig.zoom / 1.2)
    updateViewerConfig({ zoom: newZoom })
  }

  const handleFitToScreen = () => {
    updateViewerConfig({ 
      zoom: 1, 
      pan: { x: 0, y: 0 } 
    })
  }

  const handleBrightnessChange = (value: number[]) => {
    updateViewerConfig({ brightness: value[0] })
  }

  const handleContrastChange = (value: number[]) => {
    updateViewerConfig({ contrast: value[0] })
  }

  const toggleMeasurements = () => {
    updateViewerConfig({ showMeasurements: !viewerConfig.showMeasurements })
  }

  const toggleConfidence = () => {
    updateViewerConfig({ showConfidence: !viewerConfig.showConfidence })
  }

  return (
    <div className="h-12 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Zoom and Navigation */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 border-r border-border pr-3 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={viewerConfig.zoom <= 0.1}
              className="h-8 w-8 p-0"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="text-sm font-mono text-muted-foreground min-w-16 text-center">
              {Math.round(viewerConfig.zoom * 100)}%
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={viewerConfig.zoom >= 5}
              className="h-8 w-8 p-0"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToScreen}
            className="h-8 px-3"
            aria-label="Fit to screen"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Fit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetViewerConfig}
            className="h-8 px-3"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Center - Image Adjustments */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-2 border-r border-border pr-3 mr-3">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center space-x-2">
              <Slider
                value={[viewerConfig.brightness]}
                onValueChange={handleBrightnessChange}
                min={20}
                max={200}
                step={5}
                className="w-16"
                aria-label="Brightness"
              />
              <span className="text-xs text-muted-foreground min-w-8 text-center">
                {viewerConfig.brightness}%
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Contrast className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center space-x-2">
              <Slider
                value={[viewerConfig.contrast]}
                onValueChange={handleContrastChange}
                min={20}
                max={200}
                step={5}
                className="w-16"
                aria-label="Contrast"
              />
              <span className="text-xs text-muted-foreground min-w-8 text-center">
                {viewerConfig.contrast}%
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Measurement Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant={viewerConfig.showMeasurements ? "default" : "ghost"}
            size="sm"
            onClick={toggleMeasurements}
            className={cn(
              "h-8 px-3",
              viewerConfig.showMeasurements && "bg-medical-primary text-white hover:bg-medical-primary/90"
            )}
            aria-label={viewerConfig.showMeasurements ? "Hide measurements" : "Show measurements"}
          >
            <Ruler className="h-4 w-4 mr-1" />
            Measurements
          </Button>

          <Button
            variant={viewerConfig.showConfidence ? "default" : "ghost"}
            size="sm"
            onClick={toggleConfidence}
            disabled={!viewerConfig.showMeasurements}
            className={cn(
              "h-8 px-3",
              viewerConfig.showConfidence && "bg-medical-warning text-white hover:bg-medical-warning/90"
            )}
            aria-label={viewerConfig.showConfidence ? "Hide confidence scores" : "Show confidence scores"}
          >
            {viewerConfig.showConfidence ? (
              <Eye className="h-4 w-4 mr-1" />
            ) : (
              <EyeOff className="h-4 w-4 mr-1" />
            )}
            Confidence
          </Button>
        </div>
      </div>
    </div>
  )
}