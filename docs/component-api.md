# Component API Reference

## Core Components

### Layout Components

#### `MainLayout`
Primary application layout wrapper with sidebar and header.

```tsx
interface MainLayoutProps {
  children: React.ReactNode
}

function MainLayout({ children }: MainLayoutProps)
```

**Features:**
- Responsive sidebar with collapse/expand
- Automatic layout adjustments based on sidebar state
- Full-screen medical interface layout

**Usage:**
```tsx
<MainLayout>
  <YourPageContent />
</MainLayout>
```

---

#### `Header`
Application header with user info, notifications, and system status.

```tsx
function Header()
```

**Features:**
- User profile dropdown with role-based information
- Real-time notification counter with unread indicators
- System settings access
- Responsive design with mobile optimization

**State Dependencies:**
- `user`: Current user information
- `notifications`: Array of system notifications

---

#### `Sidebar`
Role-based navigation sidebar with collapsible design.

```tsx
function Sidebar()
```

**Features:**
- Role-based menu items (Admin, Radiologist, Clinician, etc.)
- Smooth collapse/expand animations
- Active page highlighting
- Keyboard navigation support
- Tooltips for collapsed state

**Navigation Items:**
- Upload: File upload interface
- Analysis: Image viewer and measurements  
- Reports: Report generation and viewing
- History: Patient study history
- Admin: Administrative functions (role-restricted)

---

#### `StatusBar`
Real-time system status and processing feedback.

```tsx
function StatusBar()
```

**Features:**
- Active file processing indicators
- System health monitoring
- Real-time clock
- Processing queue status

---

### Upload System Components

#### `UploadInterface`
Main file upload component with drag-and-drop functionality.

```tsx
function UploadInterface()
```

**Features:**
- Drag-and-drop file upload
- Multi-file batch processing (up to 10 files)
- File format validation (JPEG, PNG, DICOM)
- Size limit enforcement (50MB per file)
- Real-time upload progress
- Error handling and user feedback

**Supported Formats:**
```typescript
const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/dicom': ['.dcm', '.dicom']
}
```

**File Validation:**
- Size: Maximum 50MB per file
- Type: JPEG, PNG, or DICOM only
- Resolution: Minimum 1024px recommended
- Quality: Automatic quality assessment

---

#### `FilePreview`
Individual file preview with status and controls.

```tsx
interface FilePreviewProps {
  file: UploadFile
  validation?: ValidationResult
  onRemove: () => void
}

function FilePreview({ file, validation, onRemove }: FilePreviewProps)
```

**Features:**
- Thumbnail generation for image files
- Upload progress visualization
- Validation error/warning display
- File metadata display (size, type, status)
- Remove file functionality

**File Status States:**
- `pending`: Queued for upload
- `uploading`: Currently uploading
- `validating`: Checking file quality
- `processing`: AI analysis in progress
- `complete`: Successfully processed
- `error`: Processing failed

---

#### `ProcessingFeedback`
Real-time processing progress and stage indicators.

```tsx
function ProcessingFeedback()
```

**Features:**
- Multi-stage progress visualization
- Time estimation and elapsed time tracking
- Individual file progress tracking
- Processing stage indicators (Upload → Validation → AI Analysis)
- Queue status display

---

### Medical Image Viewer Components

#### `ImageViewer`
High-precision medical image display with interactive controls.

```tsx
function ImageViewer()
```

**Features:**
- Canvas-based medical image rendering
- High-precision zoom and pan controls
- Mouse wheel zoom with cursor-centered scaling
- Brightness and contrast adjustments
- Measurement overlay integration
- DICOM-compatible image handling

**Interaction Controls:**
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Pan image
- **Keyboard Shortcuts**: Arrow keys for panning, +/- for zoom

**Image Transformations:**
- Zoom: 0.1x to 5x magnification
- Pan: Unlimited panning with bounds checking
- Brightness: 20% to 200% adjustment
- Contrast: 20% to 200% adjustment

---

#### `ViewerControls`
Toolbar with image manipulation and measurement controls.

```tsx
function ViewerControls()
```

**Controls Available:**
- **Zoom Controls**: In, out, fit to screen, reset
- **Image Adjustments**: Brightness/contrast sliders
- **Measurement Toggles**: Show/hide measurements and confidence scores
- **View Options**: Grid overlay, ruler display

**Button API:**
```tsx
// Zoom controls
handleZoomIn(): void
handleZoomOut(): void
handleFitToScreen(): void

// Image adjustments  
handleBrightnessChange(delta: number): void
handleContrastChange(delta: number): void

// Display toggles
toggleMeasurements(): void
toggleConfidence(): void
```

---

#### `MeasurementOverlay`
Interactive Cobb angle measurement visualization.

```tsx
interface MeasurementOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  imageRef: React.RefObject<HTMLImageElement>
  viewerConfig: ViewerConfig
}

function MeasurementOverlay({ canvasRef, imageRef, viewerConfig }: MeasurementOverlayProps)
```

**Features:**
- Cobb angle visualization with color-coded curves
- Confidence level indicators
- Interactive measurement adjustment handles
- Primary and secondary curve detection
- Measurement metadata display

**Measurement Visualization:**
- **Primary Curves**: Blue color coding
- **Secondary Curves**: Green color coding
- **Confidence Colors**: 
  - Green: >90% confidence
  - Amber: 70-90% confidence
  - Red: <70% confidence

---

#### `SidePanel`
Analysis results and measurement data display.

```tsx
function SidePanel()
```

**Sections:**
- **Summary**: Severity classification and overall metrics
- **Measurements**: Detailed Cobb angle measurements
- **History**: Previous study comparisons
- **Actions**: Report generation and data export

**Severity Classifications:**
- **Normal**: < 10° (Green)
- **Mild**: 10° - 25° (Amber)
- **Moderate**: 25° - 45° (Orange)
- **Severe**: > 45° (Red)

---

### Page Components

#### `DashboardPage`
Main dashboard with system overview and statistics.

```tsx
function DashboardPage()
```

**Features:**
- System statistics and metrics
- Recent activity feed
- Quick action buttons
- System status monitoring
- User-specific welcome message

**Dashboard Sections:**
- **Statistics Cards**: Daily studies, accuracy, processing time, active users
- **Recent Activity**: Live feed of system events
- **System Status**: AI model, database, storage, queue status
- **Quick Actions**: Upload, reports, analytics shortcuts

---

#### `UploadPage`
Dedicated file upload interface page.

```tsx
function UploadPage()
```

Simply wraps the `UploadInterface` component in a scrollable container.

---

#### `AnalysisPage`
Medical image analysis interface page.

```tsx
function AnalysisPage()
```

Provides the full-screen image viewer with measurement tools.

---

## State Management

### Global State (Zustand)

#### `useAppStore`
Main application state store.

```tsx
interface AppState {
  // Authentication & User
  user: User | null
  setUser: (user: User | null) => void

  // Upload & Processing  
  uploadQueue: UploadFile[]
  addToUploadQueue: (files: File[]) => void
  updateUploadProgress: (fileId: string, progress: number, status?: UploadFile['status']) => void
  removeFromUploadQueue: (fileId: string) => void
  clearUploadQueue: () => void

  // Image Analysis
  currentStudy: Study | null
  setCurrentStudy: (study: Study | null) => void
  measurements: Measurement[]
  updateMeasurements: (measurements: Measurement[]) => void
  
  // Viewer Settings
  viewerConfig: ViewerConfig
  updateViewerConfig: (config: Partial<ViewerConfig>) => void
  resetViewerConfig: () => void

  // UI State
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  activePanel: 'upload' | 'analysis' | 'reports' | 'history' | 'admin'
  setActivePanel: (panel: AppState['activePanel']) => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}
```

### Data Types

#### `User`
```tsx
interface User {
  id: string
  email: string
  role: 'Admin' | 'Radiologist' | 'Clinician' | 'Researcher' | 'Viewer'
  institutionId?: string
}
```

#### `Study`
```tsx
interface Study {
  id: string
  patientId: string
  imageUrl: string
  uploadTimestamp: string
  processingStatus: 'pending' | 'processing' | 'complete' | 'error'
  measurements: Measurement[]
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
}
```

#### `Measurement`
```tsx
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
```

#### `ViewerConfig`
```tsx
interface ViewerConfig {
  zoom: number
  pan: { x: number; y: number }
  brightness: number
  contrast: number
  showMeasurements: boolean
  showConfidence: boolean
}
```

## Styling System

### Design Tokens
Medical-specific CSS custom properties for consistent theming.

```css
:root {
  /* Medical interface colors */
  --medical-primary: #3B82F6;
  --medical-success: #10B981;
  --medical-warning: #F59E0B;
  --medical-danger: #EF4444;
  --medical-neutral: #6B7280;
  
  /* Confidence level colors */
  --confidence-high: #10B981;
  --confidence-medium: #F59E0B;
  --confidence-low: #EF4444;
}
```

### Component Variants
Using `class-variance-authority` for consistent component styling.

```tsx
// Button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        medical: "bg-medical-primary text-white...",
        // ... other variants
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        // ... other sizes
      }
    }
  }
)
```

## Usage Examples

### Basic Upload Flow
```tsx
import { UploadInterface } from '@/components/upload/upload-interface'

function MyUploadPage() {
  return (
    <div className="container mx-auto p-6">
      <UploadInterface />
    </div>
  )
}
```

### Image Viewer Integration
```tsx
import { ImageViewer } from '@/components/viewer/image-viewer'
import { useAppStore } from '@/store/app-store'

function AnalysisView() {
  const { currentStudy } = useAppStore()
  
  if (!currentStudy) {
    return <div>Please select a study to analyze</div>
  }
  
  return <ImageViewer />
}
```

### State Management
```tsx
import { useAppStore } from '@/store/app-store'

function MyComponent() {
  const { 
    user, 
    uploadQueue, 
    addToUploadQueue,
    currentStudy,
    setCurrentStudy 
  } = useAppStore()
  
  const handleFileUpload = (files: File[]) => {
    addToUploadQueue(files)
  }
  
  return (
    // Component JSX
  )
}
```

This component API provides a complete interface for building medical imaging applications with professional-grade functionality and user experience.