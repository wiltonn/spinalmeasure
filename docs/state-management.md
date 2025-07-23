# State Management Architecture

## Overview

SpineMeasure uses **Zustand** for global state management, providing a lightweight, type-safe, and performant solution for medical workflow state. The state architecture is designed around medical imaging workflows with emphasis on real-time updates, data consistency, and user experience.

## State Architecture

### Global State Store (`useAppStore`)

The application uses a single global store with logically separated concerns:

```tsx
interface AppState {
  // Authentication & User Management
  user: User | null
  setUser: (user: User | null) => void

  // File Upload & Processing Queue
  uploadQueue: UploadFile[]
  addToUploadQueue: (files: File[]) => void
  updateUploadProgress: (fileId: string, progress: number, status?: UploadFile['status']) => void
  removeFromUploadQueue: (fileId: string) => void
  clearUploadQueue: () => void

  // Medical Image Analysis
  currentStudy: Study | null
  setCurrentStudy: (study: Study | null) => void
  measurements: Measurement[]
  updateMeasurements: (measurements: Measurement[]) => void
  
  // Image Viewer Configuration
  viewerConfig: ViewerConfig
  updateViewerConfig: (config: Partial<ViewerConfig>) => void
  resetViewerConfig: () => void

  // UI State Management
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  activePanel: 'upload' | 'analysis' | 'reports' | 'history' | 'admin'
  setActivePanel: (panel: AppState['activePanel']) => void
  
  // Notification System
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}
```

## State Domains

### 1. User & Authentication State

Manages current user session and role-based access control.

```tsx
// User data structure
interface User {
  id: string
  email: string
  role: 'Admin' | 'Radiologist' | 'Clinician' | 'Researcher' | 'Viewer'
  institutionId?: string
}

// Usage in components
function Header() {
  const { user, setUser } = useAppStore()
  
  const handleLogout = () => {
    setUser(null)
    // Additional logout logic
  }
  
  return (
    <div>
      <span>Welcome, {user?.email}</span>
      <span className="text-sm text-muted">Role: {user?.role}</span>
    </div>
  )
}
```

**Key Features:**
- Role-based access control for UI components
- Institution-based data filtering
- Session persistence (ready for integration)

### 2. Upload Queue Management

Handles multi-file upload workflows with real-time progress tracking.

```tsx
// Upload file structure
interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'validating' | 'processing' | 'complete' | 'error'
  progress: number
  error?: string
  studyId?: string
}

// State management patterns
const useUploadLogic = () => {
  const { uploadQueue, addToUploadQueue, updateUploadProgress, removeFromUploadQueue } = useAppStore()
  
  const handleFileUpload = useCallback((files: File[]) => {
    // Add files to queue
    addToUploadQueue(files)
    
    // Start upload process for each file
    files.forEach(async (file) => {
      const fileInQueue = uploadQueue.find(f => f.file === file)
      if (!fileInQueue) return
      
      try {
        // Update status to uploading
        updateUploadProgress(fileInQueue.id, 0, 'uploading')
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          updateUploadProgress(fileInQueue.id, progress)
        }
        
        // Complete upload
        updateUploadProgress(fileInQueue.id, 100, 'complete')
      } catch (error) {
        updateUploadProgress(fileInQueue.id, 0, 'error')
      }
    })
  }, [uploadQueue, addToUploadQueue, updateUploadProgress])
  
  return { handleFileUpload }
}
```

**State Flow:**
1. Files added to queue with `pending` status
2. Upload begins, status changes to `uploading`
3. Progress updates in real-time
4. Validation phase with `validating` status
5. AI processing with `processing` status
6. Final `complete` or `error` status

### 3. Medical Study Management

Manages current study selection and measurement data.

```tsx
// Study and measurement structures
interface Study {
  id: string
  patientId: string
  imageUrl: string
  uploadTimestamp: string
  processingStatus: 'pending' | 'processing' | 'complete' | 'error'
  measurements: Measurement[]
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
}

interface Measurement {
  id: string
  studyId: string
  angleValue: number
  confidence: number
  vertebraePoints: { x: number; y: number }[]
  curveType: 'primary' | 'secondary'
  timestamp: string
  modelVersion: string
}

// Usage patterns
function AnalysisWorkflow() {
  const { currentStudy, setCurrentStudy, measurements, updateMeasurements } = useAppStore()
  
  const selectStudy = useCallback(async (studyId: string) => {
    // Fetch study data
    const study = await fetchStudy(studyId)
    setCurrentStudy(study)
    
    // Load associated measurements
    const studyMeasurements = await fetchMeasurements(studyId)
    updateMeasurements(studyMeasurements)
  }, [setCurrentStudy, updateMeasurements])
  
  return (
    <div>
      {currentStudy && (
        <ImageViewer study={currentStudy} measurements={measurements} />
      )}
    </div>
  )
}
```

### 4. Viewer Configuration State

Manages image viewer display settings with real-time synchronization.

```tsx
interface ViewerConfig {
  zoom: number
  pan: { x: number; y: number }
  brightness: number
  contrast: number
  showMeasurements: boolean
  showConfidence: boolean
}

// Default configuration
const defaultViewerConfig: ViewerConfig = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  brightness: 100,
  contrast: 100,
  showMeasurements: true,
  showConfidence: true,
}

// Viewer state management
function ImageViewerControls() {
  const { viewerConfig, updateViewerConfig, resetViewerConfig } = useAppStore()
  
  const handleZoomIn = () => {
    const newZoom = Math.min(5, viewerConfig.zoom * 1.2)
    updateViewerConfig({ zoom: newZoom })
  }
  
  const handleBrightnessChange = (brightness: number) => {
    updateViewerConfig({ brightness })
  }
  
  return (
    <div className="viewer-controls">
      <button onClick={handleZoomIn}>Zoom In</button>
      <input 
        type="range" 
        min="20" 
        max="200" 
        value={viewerConfig.brightness}
        onChange={(e) => handleBrightnessChange(Number(e.target.value))}
      />
      <button onClick={resetViewerConfig}>Reset</button>
    </div>
  )
}
```

### 5. UI State Management

Controls application layout, navigation, and visual state.

```tsx
// UI state management
function NavigationLogic() {
  const { activePanel, setActivePanel, sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  
  const navigationItems = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'analysis', label: 'Analysis', icon: Search },
    { id: 'reports', label: 'Reports', icon: FileImage },
    { id: 'history', label: 'History', icon: History },
  ]
  
  return (
    <nav className={cn(
      "sidebar transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <button 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="collapse-toggle"
      >
        {sidebarCollapsed ? 'Expand' : 'Collapse'}
      </button>
      
      {navigationItems.map(item => (
        <button
          key={item.id}
          onClick={() => setActivePanel(item.id)}
          className={cn(
            "nav-item",
            activePanel === item.id && "active"
          )}
        >
          <item.icon />
          {!sidebarCollapsed && item.label}
        </button>
      ))}
    </nav>
  )
}
```

### 6. Notification System

Real-time notification management for user feedback.

```tsx
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// Notification management
function NotificationSystem() {
  const { notifications, addNotification, markNotificationRead, clearNotifications } = useAppStore()
  
  // Auto-dismiss notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      notifications
        .filter(n => !n.read && Date.now() - new Date(n.timestamp).getTime() > 5000)
        .forEach(n => markNotificationRead(n.id))
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [notifications, markNotificationRead])
  
  const showSuccessNotification = (message: string) => {
    addNotification({
      type: 'success',
      title: 'Success',
      message,
      read: false
    })
  }
  
  return (
    <div className="notification-system">
      {notifications.filter(n => !n.read).map(notification => (
        <div 
          key={notification.id}
          className={cn(
            "notification",
            `notification-${notification.type}`
          )}
        >
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <button onClick={() => markNotificationRead(notification.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
```

## State Management Patterns

### 1. Immutable Updates

All state updates maintain immutability for reliable re-renders.

```tsx
// Correct: Immutable update
const updateUploadProgress = (fileId: string, progress: number, status?: UploadFile['status']) =>
  set((state) => ({
    uploadQueue: state.uploadQueue.map((file) =>
      file.id === fileId
        ? { ...file, progress, ...(status && { status }) }
        : file
    ),
  }))

// Incorrect: Mutating state
const updateUploadProgressWrong = (fileId: string, progress: number) =>
  set((state) => {
    const file = state.uploadQueue.find(f => f.id === fileId)
    if (file) {
      file.progress = progress // This mutates the original object
    }
    return state
  })
```

### 2. Partial Updates

Use partial updates for complex objects to maintain performance.

```tsx
// Efficient partial update
const updateViewerConfig = (config: Partial<ViewerConfig>) =>
  set((state) => ({
    viewerConfig: { ...state.viewerConfig, ...config },
  }))

// Usage
updateViewerConfig({ zoom: 1.5 }) // Only updates zoom, keeps other settings
updateViewerConfig({ zoom: 1.0, pan: { x: 0, y: 0 } }) // Updates multiple properties
```

### 3. Computed State

Derive computed values in components rather than storing them in state.

```tsx
function AnalysisSummary() {
  const { measurements, currentStudy } = useAppStore()
  
  // Computed values - don't store these in state
  const studyMeasurements = useMemo(
    () => measurements.filter(m => m.studyId === currentStudy?.id),
    [measurements, currentStudy?.id]
  )
  
  const maxAngle = useMemo(
    () => Math.max(...studyMeasurements.map(m => m.angleValue), 0),
    [studyMeasurements]
  )
  
  const averageConfidence = useMemo(
    () => studyMeasurements.reduce((acc, m) => acc + m.confidence, 0) / studyMeasurements.length,
    [studyMeasurements]
  )
  
  return (
    <div>
      <div>Max Angle: {maxAngle.toFixed(1)}°</div>
      <div>Avg Confidence: {averageConfidence.toFixed(1)}%</div>
    </div>
  )
}
```

### 4. Async State Management

Handle async operations with proper loading and error states.

```tsx
// Async action pattern
const uploadFiles = async (files: File[]) => {
  // Add files to queue
  addToUploadQueue(files)
  
  // Process each file
  for (const file of files) {
    const queueItem = get().uploadQueue.find(f => f.file === file)
    if (!queueItem) continue
    
    try {
      // Update to uploading
      updateUploadProgress(queueItem.id, 0, 'uploading')
      
      // Upload file
      const uploadResult = await uploadToServer(file, (progress) => {
        updateUploadProgress(queueItem.id, progress)
      })
      
      // Start processing
      updateUploadProgress(queueItem.id, 100, 'processing')
      
      // Wait for AI analysis
      const analysisResult = await waitForAnalysis(uploadResult.studyId)
      
      // Update measurements
      updateMeasurements([...get().measurements, ...analysisResult.measurements])
      
      // Mark complete
      updateUploadProgress(queueItem.id, 100, 'complete')
      
    } catch (error) {
      updateUploadProgress(queueItem.id, 0, 'error')
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: `Failed to process ${file.name}: ${error.message}`,
        read: false
      })
    }
  }
}
```

## Performance Optimization

### 1. Selective Subscriptions

Subscribe only to the state slices you need to prevent unnecessary re-renders.

```tsx
// Good: Subscribe to specific state slice
function FileUploadStatus() {
  const uploadQueue = useAppStore(state => state.uploadQueue)
  // Only re-renders when uploadQueue changes
  
  return (
    <div>
      {uploadQueue.filter(f => f.status === 'uploading').length} files uploading
    </div>
  )
}

// Better: Use shallow comparison for objects
import { shallow } from 'zustand/shallow'

function ViewerControls() {
  const { zoom, brightness, contrast } = useAppStore(
    state => ({ 
      zoom: state.viewerConfig.zoom,
      brightness: state.viewerConfig.brightness,
      contrast: state.viewerConfig.contrast
    }),
    shallow
  )
  
  // Only re-renders when these specific values change
}
```

### 2. Memoization

Use React.memo and useMemo for expensive computations.

```tsx
const MeasurementList = React.memo(function MeasurementList({ 
  measurements 
}: { 
  measurements: Measurement[] 
}) {
  const sortedMeasurements = useMemo(
    () => measurements.sort((a, b) => b.angleValue - a.angleValue),
    [measurements]
  )
  
  return (
    <div>
      {sortedMeasurements.map(measurement => (
        <div key={measurement.id}>
          {measurement.angleValue.toFixed(1)}° ({measurement.confidence}%)
        </div>
      ))}
    </div>
  )
})
```

### 3. Debounced Updates

Debounce rapid state updates for performance-critical operations.

```tsx
import { useDebouncedCallback } from 'use-debounce'

function ViewerControls() {
  const { updateViewerConfig } = useAppStore()
  
  const debouncedUpdateBrightness = useDebouncedCallback(
    (brightness: number) => {
      updateViewerConfig({ brightness })
    },
    100 // 100ms debounce
  )
  
  return (
    <input
      type="range"
      onChange={(e) => debouncedUpdateBrightness(Number(e.target.value))}
    />
  )
}
```

## Testing State

### Unit Testing Store Actions

```tsx
// store.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@/store/app-store'

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().clearUploadQueue()
    useAppStore.getState().setUser(null)
  })
  
  it('should add files to upload queue', () => {
    const { result } = renderHook(() => useAppStore())
    
    const mockFiles = [
      new File(['content'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['content'], 'test2.png', { type: 'image/png' })
    ]
    
    act(() => {
      result.current.addToUploadQueue(mockFiles)
    })
    
    expect(result.current.uploadQueue).toHaveLength(2)
    expect(result.current.uploadQueue[0].file.name).toBe('test1.jpg')
    expect(result.current.uploadQueue[0].status).toBe('pending')
  })
  
  it('should update viewer config partially', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.updateViewerConfig({ zoom: 2.0 })
    })
    
    expect(result.current.viewerConfig.zoom).toBe(2.0)
    expect(result.current.viewerConfig.brightness).toBe(100) // unchanged
  })
})
```

## Best Practices

### 1. State Structure
- **Normalize Data**: Avoid nested objects when possible
- **Single Source of Truth**: Don't duplicate data across state
- **Flat Structure**: Keep state as flat as possible for easy updates
- **Type Safety**: Use TypeScript interfaces for all state

### 2. Action Design
- **Pure Functions**: Actions should be predictable and side-effect free
- **Granular Updates**: Provide fine-grained update methods
- **Batch Operations**: Group related updates when possible
- **Error Handling**: Always handle potential errors in async actions

### 3. Performance
- **Selective Subscriptions**: Subscribe only to needed state slices
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Debouncing**: Debounce rapid updates to prevent performance issues
- **Lazy Loading**: Load state data only when needed

This state management architecture provides a robust foundation for medical imaging workflows while maintaining performance and developer experience.