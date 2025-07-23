'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import type { ViewerConfig, Measurement } from '@/store/app-store'

interface MeasurementOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  imageRef: React.RefObject<HTMLImageElement>
  viewerConfig: ViewerConfig
}

interface Point {
  x: number
  y: number
}

export function MeasurementOverlay({
  canvasRef,
  imageRef,
  viewerConfig
}: MeasurementOverlayProps) {
  const { measurements, currentStudy } = useAppStore()
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [adjustingMeasurement, setAdjustingMeasurement] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 })

  // Draw measurements overlay
  const drawMeasurements = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current
    const mainCanvas = canvasRef.current
    const ctx = overlayCanvas?.getContext('2d')
    
    if (!overlayCanvas || !mainCanvas || !ctx) return

    // Match overlay canvas size to main canvas
    overlayCanvas.width = mainCanvas.width
    overlayCanvas.height = mainCanvas.height

    // Clear overlay
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    // Get relevant measurements for current study
    const studyMeasurements = measurements.filter(m => m.studyId === currentStudy?.id)
    
    if (studyMeasurements.length === 0) return

    studyMeasurements.forEach((measurement) => {
      drawMeasurement(ctx, measurement)
    })
  }, [measurements, currentStudy?.id, viewerConfig])

  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement) => {
    const { vertebraePoints, angleValue, confidence, curveType } = measurement
    
    if (vertebraePoints.length < 4) return // Need at least 4 points for Cobb angle

    // Transform points based on viewer config
    const transformedPoints = vertebraePoints.map(point => 
      transformPoint(point, viewerConfig)
    )

    // Determine colors based on confidence and curve type
    const confidenceColor = getConfidenceColor(confidence)
    const curveColor = curveType === 'primary' ? '#3B82F6' : '#10B981' // Blue for primary, green for secondary
    
    ctx.save()

    // Draw vertebrae boundaries (rectangles)
    ctx.strokeStyle = curveColor
    ctx.lineWidth = 2
    ctx.setLineDash([])

    // Draw endplate lines (first pair and last pair of points)
    const topPoints = transformedPoints.slice(0, 2)
    const bottomPoints = transformedPoints.slice(-2)

    // Top endplate line
    ctx.beginPath()
    ctx.moveTo(topPoints[0].x, topPoints[0].y)
    ctx.lineTo(topPoints[1].x, topPoints[1].y)
    ctx.stroke()

    // Bottom endplate line
    ctx.beginPath()
    ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y)
    ctx.lineTo(bottomPoints[1].x, bottomPoints[1].y)
    ctx.stroke()

    // Draw perpendicular lines from endplates
    const topMidpoint = {
      x: (topPoints[0].x + topPoints[1].x) / 2,
      y: (topPoints[0].y + topPoints[1].y) / 2
    }
    const bottomMidpoint = {
      x: (bottomPoints[0].x + bottomPoints[1].x) / 2,
      y: (bottomPoints[0].y + bottomPoints[1].y) / 2
    }

    // Calculate perpendicular directions
    const topDirection = {
      x: -(topPoints[1].y - topPoints[0].y),
      y: topPoints[1].x - topPoints[0].x
    }
    const bottomDirection = {
      x: -(bottomPoints[1].y - bottomPoints[0].y),
      y: bottomPoints[1].x - bottomPoints[0].x
    }

    // Normalize directions
    const topLength = Math.sqrt(topDirection.x ** 2 + topDirection.y ** 2)
    const bottomLength = Math.sqrt(bottomDirection.x ** 2 + bottomDirection.y ** 2)
    
    if (topLength > 0) {
      topDirection.x /= topLength
      topDirection.y /= topLength
    }
    if (bottomLength > 0) {
      bottomDirection.x /= bottomLength
      bottomDirection.y /= bottomLength
    }

    const perpLength = 80 // Length of perpendicular lines

    // Draw top perpendicular line
    ctx.beginPath()
    ctx.moveTo(topMidpoint.x, topMidpoint.y)
    ctx.lineTo(
      topMidpoint.x + topDirection.x * perpLength,
      topMidpoint.y + topDirection.y * perpLength
    )
    ctx.stroke()

    // Draw bottom perpendicular line
    ctx.beginPath()
    ctx.moveTo(bottomMidpoint.x, bottomMidpoint.y)
    ctx.lineTo(
      bottomMidpoint.x + bottomDirection.x * perpLength,
      bottomMidpoint.y + bottomDirection.y * perpLength
    )
    ctx.stroke()

    // Draw angle arc and label
    const arcCenter = {
      x: (topMidpoint.x + bottomMidpoint.x) / 2,
      y: (topMidpoint.y + bottomMidpoint.y) / 2
    }

    // Draw angle label
    ctx.fillStyle = confidenceColor
    ctx.font = 'bold 14px Inter'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Background for text
    const text = `${angleValue.toFixed(1)}°`
    const textMetrics = ctx.measureText(text)
    const padding = 8
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(
      arcCenter.x - textMetrics.width / 2 - padding,
      arcCenter.y - 10 - padding,
      textMetrics.width + padding * 2,
      20 + padding * 2
    )
    
    ctx.fillStyle = 'white'
    ctx.fillText(text, arcCenter.x, arcCenter.y)

    // Draw confidence indicator if enabled
    if (viewerConfig.showConfidence) {
      const confidenceText = `${confidence}%`
      ctx.font = '12px Inter'
      ctx.fillStyle = confidenceColor
      ctx.fillText(confidenceText, arcCenter.x, arcCenter.y + 20)
    }

    // Draw curve type indicator
    ctx.font = '10px Inter'
    ctx.fillStyle = curveColor
    ctx.fillText(
      curveType === 'primary' ? 'Primary' : 'Secondary',
      arcCenter.x, arcCenter.y - 25
    )

    // Draw adjustment handles
    transformedPoints.forEach((point, index) => {
      ctx.fillStyle = curveColor
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fill()
      
      // Outline for visibility
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    ctx.restore()
  }

  const transformPoint = (point: Point, config: ViewerConfig): Point => {
    // This would normally transform image coordinates to canvas coordinates
    // based on the current zoom and pan settings
    // For now, we'll assume points are already in canvas coordinates
    
    const canvas = canvasRef.current
    if (!canvas) return point

    // Apply zoom and pan transformations
    return {
      x: point.x * config.zoom + config.pan.x,
      y: point.y * config.zoom + config.pan.y
    }
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return '#10B981' // High confidence - green
    if (confidence >= 70) return '#F59E0B' // Medium confidence - amber
    return '#EF4444' // Low confidence - red
  }

  // Handle mouse interactions for measurement adjustment
  const handleMouseDown = (e: React.MouseEvent) => {
    // Implementation for dragging measurement points
    const rect = overlayCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Find if clicking on a measurement handle
    // This would check if the mouse is near any measurement points
    // and start dragging mode
  }

  // Update overlay when measurements or viewer config changes
  useEffect(() => {
    drawMeasurements()
  }, [drawMeasurements])

  return (
    <canvas
      ref={overlayCanvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 10 }}
      onMouseDown={handleMouseDown}
      role="img"
      aria-label="Measurement overlay showing Cobb angles and vertebrae detection"
    />
  )
}