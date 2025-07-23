# Development Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome 90+, Firefox 90+, Safari 14+, or Edge 90+

### Development Environment
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier (optional)
  - Auto Rename Tag

## Quick Start

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd spinemeasure

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### 2. Project Structure Overview
```
spinemeasure/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── store/              # State management
│   └── lib/                # Utilities
├── docs/                   # Documentation
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview
```

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint for code quality

# Utility commands
npm run type-check   # Run TypeScript compiler check (add if needed)
npm run clean        # Clean build artifacts (add if needed)
```

### Code Quality Tools

#### ESLint Configuration
The project uses Next.js recommended ESLint rules with TypeScript support:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Custom rules for medical application
    'react/no-unescaped-entities': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'error'
  }
}
```

#### TypeScript Configuration
Strict mode enabled for maximum type safety:

```json
// tsconfig.json highlights
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Component Development

### Creating New Components

#### 1. Component Structure
```tsx
// src/components/example/my-component.tsx
'use client' // Only if client-side features needed

interface MyComponentProps {
  title: string
  onAction?: () => void
  children?: React.ReactNode
}

export function MyComponent({ title, onAction, children }: MyComponentProps) {
  return (
    <div className="p-4 bg-card rounded-lg">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
      {onAction && (
        <button onClick={onAction} className="mt-4 btn-primary">
          Action
        </button>
      )}
    </div>
  )
}
```

#### 2. Medical Component Guidelines
- **Accessibility**: Always include ARIA labels and roles
- **Type Safety**: Define strict interfaces for props
- **Error Boundaries**: Handle errors gracefully
- **Loading States**: Show loading indicators for async operations
- **Responsive Design**: Mobile-first approach

```tsx
// Example medical component
export function MeasurementDisplay({ measurement }: { measurement: Measurement }) {
  return (
    <div 
      className="bg-card border rounded-lg p-4"
      role="region"
      aria-labelledby="measurement-title"
    >
      <h3 id="measurement-title" className="sr-only">
        Cobb Angle Measurement
      </h3>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Angle:</span>
        <span 
          className="font-mono font-bold text-lg"
          aria-label={`${measurement.angleValue} degrees`}
        >
          {measurement.angleValue.toFixed(1)}°
        </span>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-muted-foreground">Confidence:</span>
        <span 
          className={cn(
            "text-sm font-medium",
            measurement.confidence >= 90 ? 'text-medical-success' :
            measurement.confidence >= 70 ? 'text-medical-warning' : 'text-medical-danger'
          )}
          aria-label={`${measurement.confidence} percent confidence`}
        >
          {measurement.confidence}%
        </span>
      </div>
    </div>
  )
}
```

### State Management Development

#### Using Zustand Store
```tsx
// Adding new state
interface AppState {
  // ... existing state
  newFeature: boolean
  setNewFeature: (enabled: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // ... existing state
      newFeature: false,
      setNewFeature: (enabled) => set({ newFeature: enabled }),
    }),
    { name: 'spinemeasure-store' }
  )
)

// Using in components
function MyComponent() {
  const { newFeature, setNewFeature } = useAppStore()
  
  return (
    <button onClick={() => setNewFeature(!newFeature)}>
      {newFeature ? 'Disable' : 'Enable'} Feature
    </button>
  )
}
```

#### State Management Best Practices
- **Granular Updates**: Update only what changes
- **Immutable Updates**: Use spread operator for objects/arrays
- **Typed Actions**: Use TypeScript for action creators
- **Devtools Integration**: Always enable devtools for debugging

## Styling Development

### Tailwind CSS Usage

#### Medical-Specific Classes
```tsx
// Use medical color tokens
<div className="bg-medical-primary text-white">Primary Action</div>
<div className="text-confidence-high">High Confidence</div>
<div className="border-medical-danger">Error State</div>

// Responsive medical layouts
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">Main Content</div>
  <div>Sidebar</div>
</div>
```

#### Component Variants with CVA
```tsx
import { cva } from 'class-variance-authority'

const alertVariants = cva(
  "rounded-lg border p-4", // base styles
  {
    variants: {
      variant: {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-medical-success/10 border-medical-success/20 text-medical-success",
        warning: "bg-medical-warning/10 border-medical-warning/20 text-medical-warning",
        danger: "bg-medical-danger/10 border-medical-danger/20 text-medical-danger"
      }
    },
    defaultVariants: {
      variant: "info"
    }
  }
)

export function Alert({ variant, children, className, ...props }) {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}
```

### Custom CSS
When Tailwind utilities aren't sufficient:

```css
/* src/app/globals.css */
@layer components {
  .medical-grid {
    display: grid;
    grid-template-areas: 
      "header header header"
      "sidebar main panel"
      "status status status";
    grid-template-rows: auto 1fr auto;
    grid-template-columns: auto 1fr auto;
    height: 100vh;
  }
  
  .measurement-overlay {
    pointer-events: none;
    position: absolute;
    inset: 0;
  }
  
  .measurement-overlay.interactive {
    pointer-events: auto;
  }
}
```

## Testing Guidelines

### Unit Testing Setup (Ready to Add)
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Create jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

### Example Component Test
```tsx
// src/components/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button text correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies medical variant styles', () => {
    render(<Button variant="medical">Medical Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-medical-primary')
  })
})
```

### E2E Testing with Playwright (Ready to Add)
```bash
npm install --save-dev @playwright/test

# Create playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
  },
})
```

## Performance Optimization

### Bundle Analysis
```bash
# Add bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // existing config
})

# Run analysis
ANALYZE=true npm run build
```

### Image Optimization
```tsx
// Use Next.js Image component for medical images
import Image from 'next/image'

function MedicalImageThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={150}
      height={150}
      className="rounded-lg object-cover"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." // generated blur placeholder
    />
  )
}
```

### Code Splitting
```tsx
// Dynamic imports for large components
import { lazy, Suspense } from 'react'

const MedicalImageViewer = lazy(() => import('@/components/viewer/image-viewer'))

function AnalysisPage() {
  return (
    <Suspense fallback={<div>Loading medical viewer...</div>}>
      <MedicalImageViewer />
    </Suspense>
  )
}
```

## Debugging

### Development Tools
1. **React DevTools**: Browser extension for component inspection
2. **Zustand DevTools**: Redux DevTools integration for state
3. **Next.js DevTools**: Built-in performance and debugging tools
4. **Browser DevTools**: Network, console, and performance tabs

### Common Issues

#### TypeScript Errors
```bash
# Check for type errors
npm run type-check

# Common fixes
- Ensure all props have proper types
- Use 'unknown' instead of 'any'
- Add proper return types to functions
```

#### Styling Issues
```bash
# Tailwind not working
- Check if @tailwind directives are in globals.css
- Verify tailwind.config.js includes all content paths
- Restart dev server after config changes

# Custom CSS not applying
- Use @layer directive for custom styles
- Check specificity conflicts
- Verify class names are correct
```

#### State Management Issues
```bash
# State not updating
- Ensure immutable updates with spread operator
- Check if component is subscribed to correct store slice
- Verify store actions are called correctly

# State persistence issues
- Enable Zustand devtools for debugging
- Check browser storage for persisted state
- Clear storage if needed for testing
```

## Deployment Preparation

### Environment Variables
```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://localhost/spinemeasure_dev
UPLOADTHING_SECRET=your_upload_secret

# .env.production
NEXT_PUBLIC_API_URL=https://api.spinemeasure.com
DATABASE_URL=your_production_db_url
UPLOADTHING_SECRET=your_production_secret
```

### Build Optimization
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-image-cdn.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  },
  // Medical application optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
```

### Production Checklist
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Error boundaries implemented
- [ ] Loading states added
- [ ] Accessibility tested
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Monitoring setup

This development guide provides a comprehensive foundation for building and maintaining the SpineMeasure frontend application with professional development practices.