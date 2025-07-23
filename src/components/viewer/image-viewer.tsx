'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { ViewerControls } from './viewer-controls'
import { MeasurementOverlay } from './measurement-overlay'
import { SidePanel } from './side-panel'
import { cn } from '@/lib/utils'

interface Point {
  x: number
  y: number
}

export function ImageViewer() {
  const { currentStudy, viewerConfig, updateViewerConfig } = useAppStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current
    
    if (!canvas || !ctx || !img) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply brightness and contrast filters
    ctx.filter = `brightness(${viewerConfig.brightness}%) contrast(${viewerConfig.contrast}%)`

    // Calculate image dimensions and position
    const canvasAspect = canvas.width / canvas.height
    const imageAspect = img.width / img.height
    
    let drawWidth, drawHeight

    // Fit image to canvas while maintaining aspect ratio
    if (imageAspect > canvasAspect) {
      drawWidth = canvas.width * viewerConfig.zoom
      drawHeight = (canvas.width / imageAspect) * viewerConfig.zoom
    } else {
      drawWidth = (canvas.height * imageAspect) * viewerConfig.zoom
      drawHeight = canvas.height * viewerConfig.zoom
    }

    // Center image and apply pan
    const drawX = (canvas.width - drawWidth) / 2 + viewerConfig.pan.x
    const drawY = (canvas.height - drawHeight) / 2 + viewerConfig.pan.y

    // Draw image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    // Reset filter for other drawing operations
    ctx.filter = 'none'
  }, [viewerConfig])

  // Load and display image
  useEffect(() => {
    if (!currentStudy?.imageUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setImageLoaded(false)
    setImageError(null)

    // Load image
    const img = new Image()
    img.crossOrigin = 'anonymous' // Handle CORS for medical images
    
    img.onload = () => {
      imageRef.current = img
      
      // Set canvas size to match container
      const container = containerRef.current
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
      
      drawImage()
      setImageLoaded(true)
    }

    img.onerror = () => {
      setImageError('Failed to load medical image. Please check the file format and try again.')
    }

    img.src = currentStudy.imageUrl
  }, [currentStudy?.imageUrl, drawImage])

  // Redraw image when viewer config changes
  useEffect(() => {
    if (imageLoaded) {
      drawImage()
    }
  }, [viewerConfig.zoom, viewerConfig.pan, viewerConfig.brightness, viewerConfig.contrast, imageLoaded, drawImage])

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const deltaY = e.deltaY
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(5, viewerConfig.zoom * zoomFactor))

    // Zoom towards mouse position
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const zoomRatio = newZoom / viewerConfig.zoom
    const newPanX = mouseX - (mouseX - viewerConfig.pan.x) * zoomRatio
    const newPanY = mouseY - (mouseY - viewerConfig.pan.y) * zoomRatio

    updateViewerConfig({
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY }
    })
  }, [viewerConfig.zoom, viewerConfig.pan, updateViewerConfig])

  // Handle mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    updateViewerConfig({
      pan: {
        x: viewerConfig.pan.x + deltaX,
        y: viewerConfig.pan.y + deltaY
      }
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart, viewerConfig.pan, updateViewerConfig])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (imageLoaded) {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (canvas && container) {
          canvas.width = container.clientWidth
          canvas.height = container.clientHeight
          drawImage()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [imageLoaded, drawImage])

  if (!currentStudy) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-muted-foreground">📐</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Study Selected</h3>
          <p className="text-muted-foreground">
            Please upload and select a medical image to begin analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex">
      {/* Main Viewer Area */}
      <div className="flex-1 flex flex-col">
        <ViewerControls />
        
        <div 
          ref={containerRef}
          className="flex-1 relative bg-black overflow-hidden"
        >
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">Image Load Error</h3>
                <p className="text-muted-foreground">{imageError}</p>
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                className={cn(
                  "absolute inset-0 w-full h-full",
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                role="img"
                aria-label="Medical X-ray image"
              />
              
              {/* Measurement Overlay */}
              {imageLoaded && viewerConfig.showMeasurements && (
                <MeasurementOverlay 
                  canvasRef={canvasRef}
                  viewerConfig={viewerConfig}
                />
              )}
              
              {/* Loading indicator */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Loading medical image...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <SidePanel />
    </div>
  )
}