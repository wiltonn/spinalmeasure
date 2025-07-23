import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  role: 'Admin' | 'Radiologist' | 'Clinician' | 'Researcher' | 'Viewer'
  institutionId?: string
}

export interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'validating' | 'processing' | 'complete' | 'error'
  progress: number
  error?: string
  studyId?: string
}

export interface Measurement {
  id: string
  studyId: string
  angleValue: number
  confidence: number
  vertebraePoints: { x: number; y: number }[]
  curveType: 'primary' | 'secondary'
  timestamp: string
  modelVersion: string
}

export interface Study {
  id: string
  patientId: string
  imageUrl: string
  uploadTimestamp: string
  processingStatus: 'pending' | 'processing' | 'complete' | 'error'
  measurements: Measurement[]
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
}

export interface ViewerConfig {
  zoom: number
  pan: { x: number; y: number }
  brightness: number
  contrast: number
  showMeasurements: boolean
  showConfidence: boolean
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

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

const defaultViewerConfig: ViewerConfig = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  brightness: 100,
  contrast: 100,
  showMeasurements: true,
  showConfidence: true,
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Authentication & User
      user: null,
      setUser: (user) => set({ user }),

      // Upload & Processing
      uploadQueue: [],
      addToUploadQueue: (files) => {
        const newFiles: UploadFile[] = files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          status: 'pending',
          progress: 0,
        }))
        set((state) => ({
          uploadQueue: [...state.uploadQueue, ...newFiles],
        }))
      },
      updateUploadProgress: (fileId, progress, status) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.map((file) =>
            file.id === fileId
              ? { ...file, progress, ...(status && { status }) }
              : file
          ),
        })),
      removeFromUploadQueue: (fileId) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.filter((file) => file.id !== fileId),
        })),
      clearUploadQueue: () => set({ uploadQueue: [] }),

      // Image Analysis
      currentStudy: null,
      setCurrentStudy: (study) => set({ currentStudy: study }),
      measurements: [],
      updateMeasurements: (measurements) => set({ measurements }),

      // Viewer Settings
      viewerConfig: defaultViewerConfig,
      updateViewerConfig: (config) =>
        set((state) => ({
          viewerConfig: { ...state.viewerConfig, ...config },
        })),
      resetViewerConfig: () => set({ viewerConfig: defaultViewerConfig }),

      // UI State
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      activePanel: 'upload',
      setActivePanel: (panel) => set({ activePanel: panel }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }))
      },
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'spinemeasure-store',
    }
  )
)