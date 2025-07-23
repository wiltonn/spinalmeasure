# SpineMeasure Frontend Architecture

## Overview

The SpineMeasure frontend is a modern React application built with Next.js 15 that provides a professional medical imaging interface for spinal X-ray analysis. It features drag-and-drop file upload, high-precision image viewing, interactive measurement overlays, and comprehensive analysis tools.

## Tech Stack

### Core Framework
- **Next.js 15.4.3** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript** - Full type safety with strict mode

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS with CSS variables
- **shadcn/ui** - Accessible component library (new-york style)
- **Framer Motion** - Animation and gesture library
- **Lucide React** - Icon library

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management (installed, ready to use)

### File Handling
- **React Dropzone** - Drag-and-drop file uploads

### Development Tools
- **ESLint** - Code linting with Next.js rules
- **PostCSS** - CSS processing for Tailwind

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts and metadata
│   ├── page.tsx           # Main application with routing logic
│   └── globals.css        # Global styles and design tokens
├── components/
│   ├── layout/            # Layout components
│   │   ├── main-layout.tsx    # Primary layout wrapper
│   │   ├── header.tsx         # Application header
│   │   ├── sidebar.tsx        # Navigation sidebar
│   │   └── status-bar.tsx     # Real-time status bar
│   ├── pages/             # Page-level components
│   │   ├── dashboard-page.tsx # Main dashboard
│   │   ├── upload-page.tsx    # File upload interface
│   │   └── analysis-page.tsx  # Image analysis view
│   ├── upload/            # File upload system
│   │   ├── upload-interface.tsx   # Main upload component
│   │   ├── file-preview.tsx       # Individual file preview
│   │   └── processing-feedback.tsx # Progress feedback
│   ├── viewer/            # Medical image viewer
│   │   ├── image-viewer.tsx       # Core image display
│   │   ├── viewer-controls.tsx    # Zoom/pan controls
│   │   ├── measurement-overlay.tsx # Cobb angle overlay
│   │   └── side-panel.tsx         # Analysis results panel
│   └── ui/                # Base UI components
│       └── button.tsx         # Custom button component
├── store/
│   └── app-store.ts       # Zustand state management
└── lib/
    └── utils.ts           # Utility functions (cn, etc.)
```

## Architecture Patterns

### Component Organization
- **Atomic Design** - Components organized by complexity level
- **Feature-Based** - Related components grouped by functionality
- **Accessibility-First** - All components include ARIA attributes
- **Type-Safe** - Full TypeScript coverage with strict mode

### State Management Strategy
- **Global State** - User, upload queue, viewer settings in Zustand
- **Local State** - Component-specific state with React hooks
- **Server State** - Ready for React Query integration
- **Persistent State** - Configuration persisted via Zustand devtools

### Styling Approach
- **Design System** - Medical-specific color tokens and components
- **Mobile-First** - Responsive design starting from 320px
- **CSS Variables** - Theme support with light/dark modes
- **Component Variants** - Consistent styling via class-variance-authority

## Key Features

### Medical Image Viewer
- **High-Precision Display** - Canvas-based rendering for medical accuracy
- **Interactive Controls** - Zoom, pan, brightness/contrast adjustment
- **Measurement Overlays** - Interactive Cobb angle visualization
- **Confidence Indicators** - Color-coded AI confidence levels

### File Upload System
- **Drag-and-Drop** - Multi-file upload with visual feedback
- **Format Support** - JPEG, PNG, DICOM files up to 50MB each
- **Batch Processing** - Up to 10 files simultaneously
- **Real-Time Progress** - Processing stage indicators and time estimation

### Professional Interface
- **Role-Based Navigation** - Different views for different user roles
- **Real-Time Status** - Live processing updates and system status
- **Accessibility** - WCAG 2.1 AA compliance with keyboard navigation
- **Responsive Design** - Optimized for desktop, tablet, and mobile

## Design System

### Color Tokens
```css
/* Medical interface colors */
--medical-primary: #3B82F6;      /* Trustworthy blue */
--medical-success: #10B981;      /* Safe green */
--medical-warning: #F59E0B;      /* Attention amber */
--medical-danger: #EF4444;       /* Alert red */
--medical-neutral: #6B7280;      /* Professional gray */

/* Confidence levels */
--confidence-high: #10B981;      /* >90% confidence */
--confidence-medium: #F59E0B;    /* 70-90% confidence */
--confidence-low: #EF4444;       /* <70% confidence */
```

### Typography
- **Primary Font**: Inter (sans-serif)
- **Monospace Font**: Roboto Mono
- **Fallback Fonts**: System fonts for reliability

### Responsive Breakpoints
- **Mobile**: 320px - 768px (single column, simplified viewer)
- **Tablet**: 768px - 1024px (dual panel layout)
- **Desktop**: 1024px - 1440px (full tri-panel interface)
- **Large**: 1440px+ (multi-monitor support)

## Performance Considerations

### Optimization Strategies
- **Code Splitting** - Automatic with Next.js App Router
- **Image Optimization** - Next.js Image component ready to use
- **Bundle Analysis** - Webpack bundle analyzer available
- **Tree Shaking** - Unused code elimination

### Medical Image Handling
- **Canvas Rendering** - Hardware-accelerated medical image display
- **Memory Management** - Efficient handling of large DICOM files
- **Progressive Loading** - Staged loading for large datasets
- **Caching Strategy** - Client-side caching for viewer settings

## Security & Compliance

### Data Protection
- **Client-Side Validation** - File type and size validation
- **CORS Handling** - Proper cross-origin resource sharing
- **Memory Safety** - Proper cleanup of canvas contexts
- **Type Safety** - Full TypeScript coverage prevents runtime errors

### Medical Compliance
- **HIPAA Ready** - No PHI stored in local storage
- **Audit Trail** - All user actions logged in state
- **Access Control** - Role-based component rendering
- **Data Retention** - Configurable retention policies

## Integration Points

### Backend API Integration
- **Authentication** - Ready for Clerk.js or custom auth
- **File Upload** - Multipart upload with progress tracking
- **AI Processing** - WebSocket or polling for real-time updates
- **Report Generation** - PDF and FHIR export endpoints

### External Services
- **AI Model** - Containerized inference service integration
- **DICOM Processing** - Ready for medical imaging libraries
- **Cloud Storage** - S3-compatible storage integration
- **Notification System** - Real-time alerts and updates

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### Code Quality
- **TypeScript** - Strict mode enabled for type safety
- **ESLint** - Next.js recommended rules with custom medical rules
- **Prettier** - Code formatting (ready to configure)
- **Husky** - Git hooks for pre-commit validation (ready to add)

### Testing Strategy
- **Unit Tests** - Component testing with React Testing Library (ready to add)
- **Integration Tests** - User workflow testing (ready to add)
- **E2E Tests** - Playwright for medical workflow validation (ready to add)
- **Accessibility Tests** - Automated WCAG compliance checking (ready to add)

## Deployment Considerations

### Production Build
- **Environment Variables** - Separate configs for dev/staging/prod
- **CDN Integration** - Static asset optimization
- **Monitoring** - Error tracking and performance monitoring
- **Scaling** - Horizontal scaling for high availability

### Browser Support
- **Modern Browsers** - Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Medical Workstations** - Tested on common radiology systems
- **Mobile Support** - iOS Safari, Android Chrome
- **Accessibility** - Screen readers and assistive technologies

This architecture provides a solid foundation for a production-ready medical imaging application with room for growth and integration with backend services.