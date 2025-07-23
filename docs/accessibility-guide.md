# Accessibility Compliance Guide

## Overview

SpineMeasure is designed to meet **WCAG 2.1 AA** accessibility standards, ensuring the application is usable by healthcare professionals with disabilities. This guide documents the accessibility features implemented and provides guidelines for maintaining compliance.

## Accessibility Features

### 1. Semantic HTML Structure

All components use proper semantic HTML elements with appropriate roles and landmarks.

```tsx
// Layout structure with semantic elements
<main role="main" aria-label="Medical Image Analysis Interface">
  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="#upload" aria-current="page">Upload</a></li>
      <li><a href="#analysis">Analysis</a></li>
    </ul>
  </nav>
  
  <section aria-labelledby="viewer-heading">
    <h2 id="viewer-heading">Medical Image Viewer</h2>
    <canvas role="img" aria-describedby="measurement-summary" />
  </section>
  
  <aside aria-labelledby="controls-heading">
    <h2 id="controls-heading">Measurement Controls</h2>
    <!-- Controls content -->
  </aside>
</main>
```

### 2. ARIA Labels and Descriptions

Comprehensive ARIA labeling for complex medical interfaces.

```tsx
// Image viewer with proper ARIA labels
<canvas
  ref={canvasRef}
  role="img"
  aria-label="Medical X-ray image with Cobb angle measurements"
  aria-describedby="measurement-summary confidence-scores"
  tabIndex={0}
  onKeyDown={handleKeyboardNavigation}
/>

// Measurement display with descriptive labels
<div 
  className="measurement-result"
  role="region"
  aria-labelledby="measurement-title"
  aria-describedby="measurement-details"
>
  <h3 id="measurement-title">Primary Curve Measurement</h3>
  <div id="measurement-details">
    <span aria-label="Cobb angle measurement">23.4 degrees</span>
    <span aria-label="AI confidence level">89 percent confidence</span>
  </div>
</div>

// Interactive controls with state information
<button
  aria-pressed={showMeasurements}
  aria-describedby="measurements-help"
  onClick={toggleMeasurements}
>
  {showMeasurements ? 'Hide' : 'Show'} Measurements
</button>
<div id="measurements-help" className="sr-only">
  Toggle visibility of Cobb angle measurement overlays on the X-ray image
</div>
```

### 3. Keyboard Navigation

Full keyboard accessibility for all interactive elements.

```tsx
// Keyboard navigation for image viewer
const handleKeyboardNavigation = (e: KeyboardEvent) => {
  switch (e.key) {
    case '+':
    case '=':
      e.preventDefault()
      handleZoomIn()
      announceToScreenReader(`Zoomed in to ${(viewerConfig.zoom * 100).toFixed(0)}%`)
      break
      
    case '-':
    case '_':
      e.preventDefault()
      handleZoomOut()
      announceToScreenReader(`Zoomed out to ${(viewerConfig.zoom * 100).toFixed(0)}%`)
      break
      
    case 'ArrowUp':
      e.preventDefault()
      updateViewerConfig({ pan: { x: viewerConfig.pan.x, y: viewerConfig.pan.y - 10 } })
      announceToScreenReader('Panned up')
      break
      
    case 'ArrowDown':
      e.preventDefault()
      updateViewerConfig({ pan: { x: viewerConfig.pan.x, y: viewerConfig.pan.y + 10 } })
      announceToScreenReader('Panned down')
      break
      
    case 'ArrowLeft':
      e.preventDefault()
      updateViewerConfig({ pan: { x: viewerConfig.pan.x - 10, y: viewerConfig.pan.y } })
      announceToScreenReader('Panned left')
      break
      
    case 'ArrowRight':
      e.preventDefault()
      updateViewerConfig({ pan: { x: viewerConfig.pan.x + 10, y: viewerConfig.pan.y } })
      announceToScreenReader('Panned right')
      break
      
    case 'Home':
      e.preventDefault()
      resetViewerConfig()
      announceToScreenReader('Reset to original view')
      break
      
    case 'Tab':
      // Allow natural tab navigation to measurement handles
      focusNextMeasurement()
      break
  }
}

// Keyboard shortcuts help
const KeyboardShortcuts = () => (
  <div className="sr-only" id="keyboard-help">
    <h3>Keyboard Shortcuts</h3>
    <ul>
      <li>Plus (+) or Equals (=): Zoom in</li>
      <li>Minus (-): Zoom out</li>
      <li>Arrow keys: Pan image</li>
      <li>Home: Reset view</li>
      <li>Tab: Navigate to measurement points</li>
      <li>Space: Toggle measurement visibility</li>
      <li>M: Toggle measurement overlay</li>
      <li>C: Toggle confidence display</li>
    </ul>
  </div>
)
```

### 4. Screen Reader Support

Comprehensive screen reader announcements for dynamic content.

```tsx
// Screen reader announcement utility
const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Upload progress announcements
const FileUploadProgress = ({ file }: { file: UploadFile }) => {
  const prevProgress = useRef<number>(0)
  
  useEffect(() => {
    // Announce progress milestones
    if (file.progress - prevProgress.current >= 25) {
      announceToScreenReader(
        `Upload progress for ${file.file.name}: ${file.progress}% complete`,
        'polite'
      )
      prevProgress.current = file.progress
    }
    
    // Announce status changes
    if (file.status === 'complete') {
      announceToScreenReader(
        `${file.file.name} upload completed successfully`,
        'assertive'
      )
    } else if (file.status === 'error') {
      announceToScreenReader(
        `${file.file.name} upload failed. ${file.error || 'Please try again.'}`,
        'assertive'
      )
    }
  }, [file.progress, file.status, file.file.name, file.error])
  
  return null // This component only provides announcements
}

// Measurement announcements
const MeasurementAnnouncer = ({ measurements }: { measurements: Measurement[] }) => {
  const prevMeasurements = useRef<Measurement[]>([])
  
  useEffect(() => {
    const newMeasurements = measurements.filter(
      m => !prevMeasurements.current.some(prev => prev.id === m.id)
    )
    
    newMeasurements.forEach(measurement => {
      const confidenceLevel = measurement.confidence >= 90 ? 'high' : 
                             measurement.confidence >= 70 ? 'medium' : 'low'
      
      announceToScreenReader(
        `New ${measurement.curveType} curve detected: ${measurement.angleValue.toFixed(1)} degrees ` +
        `with ${confidenceLevel} confidence at ${measurement.confidence}%`,
        'assertive'
      )
    })
    
    prevMeasurements.current = measurements
  }, [measurements])
  
  return null
}
```

### 5. Focus Management

Proper focus management for dynamic content and modal interactions.

```tsx
// Focus trap for modal dialogs
const useFocusTrap = (isOpen: boolean, containerRef: RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    
    // Focus first element
    firstFocusable?.focus()
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [isOpen, containerRef])
}

// Focus management for sidebar navigation
const Sidebar = () => {
  const { sidebarCollapsed } = useAppStore()
  const sidebarRef = useRef<HTMLElement>(null)
  
  // Manage focus when sidebar collapses/expands
  useEffect(() => {
    if (sidebarCollapsed) {
      // Move focus to main content when sidebar collapses
      const mainContent = document.querySelector('main')
      if (mainContent instanceof HTMLElement) {
        mainContent.focus()
      }
    }
  }, [sidebarCollapsed])
  
  return (
    <aside
      ref={sidebarRef}
      aria-label="Main navigation"
      className={cn("sidebar", sidebarCollapsed && "collapsed")}
    >
      {/* Navigation items */}
    </aside>
  )
}
```

### 6. Color and Contrast

High contrast color scheme meeting WCAG AA standards.

```css
/* High contrast medical color palette */
:root {
  /* Text contrast ratios >4.5:1 for normal text, >3:1 for large text */
  --text-primary: #1a1a1a;      /* 14.8:1 contrast on white */
  --text-secondary: #4a4a4a;    /* 7.0:1 contrast on white */
  --text-muted: #6b7280;        /* 4.6:1 contrast on white */
  
  /* Medical status colors with sufficient contrast */
  --confidence-high: #0f766e;   /* 5.2:1 contrast on white */
  --confidence-medium: #b45309; /* 4.8:1 contrast on white */
  --confidence-low: #b91c1c;    /* 5.7:1 contrast on white */
  
  /* Interactive element colors */
  --button-primary: #1d4ed8;    /* 6.1:1 contrast on white */
  --button-hover: #1e40af;      /* 7.2:1 contrast on white */
  --focus-ring: #3b82f6;        /* High visibility focus indicators */
}

/* Dark mode with maintained contrast ratios */
.dark {
  --text-primary: #f9fafb;      /* 15.6:1 contrast on dark background */
  --text-secondary: #e5e7eb;    /* 10.4:1 contrast on dark background */
  --text-muted: #9ca3af;        /* 5.1:1 contrast on dark background */
}

/* Focus indicators */
.focus-visible:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --text-primary: #000000;
    --text-secondary: #2d2d2d;
    --button-primary: #0000ee;
    --confidence-high: #006600;
    --confidence-medium: #cc6600;
    --confidence-low: #cc0000;
  }
}
```

### 7. Responsive Text and Zoom

Support for browser zoom and text scaling up to 200%.

```css
/* Responsive text scaling */
.text-base {
  font-size: clamp(0.875rem, 1rem + 0.2vw, 1.125rem);
  line-height: 1.6;
}

.text-lg {
  font-size: clamp(1rem, 1.125rem + 0.3vw, 1.25rem);
  line-height: 1.5;
}

/* Ensure clickable areas remain accessible at high zoom */
.clickable {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem;
}

/* Flexible layouts that work at high zoom levels */
.viewer-layout {
  display: grid;
  grid-template-columns: minmax(250px, 1fr) 3fr minmax(300px, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .viewer-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }
}

/* Text doesn't overflow containers at high zoom */
.measurement-label {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

## Testing Accessibility

### Automated Testing

```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react jest-axe

# Add to test setup
// jest.setup.js
import 'jest-axe/extend-expect'
import { configureAxe } from 'jest-axe'

const axe = configureAxe({
  rules: {
    // Custom rules for medical interface
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true }
  }
})
```

```tsx
// Component accessibility tests
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ImageViewer } from '@/components/viewer/image-viewer'

expect.extend(toHaveNoViolations)

describe('ImageViewer Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ImageViewer />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('should have proper ARIA labels', () => {
    render(<ImageViewer />)
    
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Medical X-ray image')
    )
    
    expect(screen.getByRole('button', { name: /zoom in/i }))
      .toBeInTheDocument()
  })
})
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements reachable via Tab key
- [ ] Focus indicators clearly visible
- [ ] Logical tab order maintained
- [ ] Escape key closes modals/overlays
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate measurement points

#### Screen Reader Testing
- [ ] Meaningful page titles and headings
- [ ] Alt text for all images
- [ ] Form labels properly associated
- [ ] Status changes announced
- [ ] Error messages read aloud
- [ ] Progress updates communicated

#### Visual Testing
- [ ] 4.5:1 contrast ratio for normal text
- [ ] 3:1 contrast ratio for large text
- [ ] Focus indicators visible with 2px minimum
- [ ] Text readable at 200% zoom
- [ ] Layout doesn't break at high zoom
- [ ] Color not sole means of conveying information

#### Motor Impairment Testing
- [ ] Click targets minimum 44x44px
- [ ] Adequate spacing between clickable elements
- [ ] Drag operations have keyboard alternatives
- [ ] Timeout extensions available
- [ ] Sticky hover states avoided

## Implementation Examples

### Accessible File Upload

```tsx
const AccessibleFileUpload = () => {
  const [dragActive, setDragActive] = useState(false)
  const { addToUploadQueue } = useAppStore()
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center",
        "focus-within:ring-2 focus-within:ring-medical-primary",
        dragActive && "border-medical-primary bg-medical-primary/5"
      )}
      role="region"
      aria-labelledby="upload-title"
      aria-describedby="upload-instructions"
    >
      <h2 id="upload-title" className="text-xl font-semibold mb-2">
        Upload Medical Images
      </h2>
      
      <div id="upload-instructions" className="text-muted-foreground mb-4">
        <p>Drop your X-ray images here or use the button below.</p>
        <p>Supports JPEG, PNG, and DICOM files up to 50MB each.</p>
      </div>
      
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.dcm,.dicom"
        onChange={(e) => {
          if (e.target.files) {
            addToUploadQueue(Array.from(e.target.files))
          }
        }}
        className="sr-only"
        id="file-input"
        aria-describedby="file-requirements"
      />
      
      <label
        htmlFor="file-input"
        className="inline-flex items-center px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary/90 focus:outline-none focus:ring-2 focus:ring-medical-primary focus:ring-offset-2 cursor-pointer"
      >
        <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
        Select Files
      </label>
      
      <div id="file-requirements" className="text-xs text-muted-foreground mt-2">
        Maximum 10 files, 50MB each. Supported formats: JPEG, PNG, DICOM
      </div>
    </div>
  )
}
```

### Accessible Measurement Display

```tsx
const AccessibleMeasurementDisplay = ({ measurement }: { measurement: Measurement }) => {
  const confidenceLevel = measurement.confidence >= 90 ? 'high' : 
                          measurement.confidence >= 70 ? 'medium' : 'low'
  
  return (
    <div
      className="bg-card border rounded-lg p-4"
      role="article"
      aria-labelledby={`measurement-${measurement.id}-title`}
      aria-describedby={`measurement-${measurement.id}-details`}
    >
      <h3 
        id={`measurement-${measurement.id}-title`}
        className="font-semibold text-foreground mb-2"
      >
        {measurement.curveType === 'primary' ? 'Primary' : 'Secondary'} Curve Measurement
      </h3>
      
      <div id={`measurement-${measurement.id}-details`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Cobb Angle:</span>
          <span 
            className="font-mono font-bold text-lg"
            aria-label={`${measurement.angleValue.toFixed(1)} degrees`}
          >
            {measurement.angleValue.toFixed(1)}°
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">AI Confidence:</span>
          <span 
            className={cn(
              "font-medium",
              confidenceLevel === 'high' && "text-confidence-high",
              confidenceLevel === 'medium' && "text-confidence-medium",
              confidenceLevel === 'low' && "text-confidence-low"
            )}
            aria-label={`${measurement.confidence} percent confidence, ${confidenceLevel} level`}
          >
            {measurement.confidence}%
            <span className="sr-only"> ({confidenceLevel} confidence)</span>
          </span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        <time dateTime={measurement.timestamp}>
          Analyzed: {new Date(measurement.timestamp).toLocaleString()}
        </time>
        <span className="mx-2">•</span>
        Model v{measurement.modelVersion}
      </div>
    </div>
  )
}
```

## Accessibility Maintenance

### Code Review Checklist
- [ ] ARIA labels added for complex interactions
- [ ] Keyboard navigation implemented
- [ ] Focus management handled properly
- [ ] Color contrast verified
- [ ] Screen reader announcements added
- [ ] Text alternatives provided

### Ongoing Testing
- **Automated**: Run axe-core tests in CI/CD pipeline
- **Manual**: Weekly testing with keyboard and screen reader
- **User Testing**: Quarterly testing with disabled users
- **Compliance**: Annual WCAG 2.1 AA audit

This accessibility implementation ensures SpineMeasure is usable by all healthcare professionals, regardless of their abilities, while maintaining full functionality and professional appearance.