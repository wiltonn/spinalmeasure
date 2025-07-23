# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.3 application using TypeScript and Tailwind CSS v4. The project uses the modern App Router architecture and is configured with shadcn/ui components.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Install dependencies
npm install
```

## Working Preferences & Memories

### Visual Development
- Use the Playwright MCP server when making visual changes to check work and analyze console logs
- The project uses Tailwind CSS v4 with CSS variables for theming support

### Code Development  
- Ask for clarification upfront when more direction is needed
- Prefer editing existing files over creating new ones
- Use `cn()` utility from `@/lib/utils` for className merging

### Git & CLI Workflow
- Use the `gh` CLI tool for GitHub operations (issues, PRs, comments)
- Current branch: main
- Modified files: package.json, package-lock.json, globals.css, plus new lib/ directory

## Architecture

### Tech Stack
- **Framework**: Next.js 15.4.3 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui configured (new-york style, Lucide icons)
- **Utility Libraries**: 
  - `clsx` and `tailwind-merge` for className management (via `cn()` utility)
  - `class-variance-authority` for component variants
- **Fonts**: Geist Sans and Geist Mono (variable fonts), with Inter, Roboto Mono, and Lora fallbacks
- **Build Tool**: Turbopack (development), Webpack (production)

### Project Structure
- `/src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with font configuration and metadata
  - `page.tsx` - Home page component  
  - `globals.css` - Global styles, Tailwind setup, and comprehensive theme system
  - `favicon.ico` - Site favicon
- `/src/lib/utils.ts` - Utility functions including `cn()` for className merging
- `/public/` - Static assets (SVGs, images, icons)
- `/components.json` - shadcn/ui configuration (new-york style, Lucide icons)

### Key Patterns
- Path aliases configured in TypeScript:
  - `@/*` → `./src/*`
  - `@/components` → component directory
  - `@/lib` → utilities and libraries
  - `@/ui` → UI components
- CSS custom properties for light/dark theme support
- Responsive design using Tailwind's mobile-first approach
- Server Components by default in App Router
- Use `cn()` utility from `@/lib/utils` for merging Tailwind classes

### Important Configuration
- **TypeScript**: Target ES2017, strict mode enabled, path aliases configured
- **ESLint**: Flat config (v9) with Next.js recommended rules
- **PostCSS**: Configured for Tailwind CSS v4 processing with `@tailwindcss/postcss`
- **Theme System**: Comprehensive CSS variables for light/dark modes, colors, typography
- **Next.js**: Minimal configuration, relies on defaults with Turbopack dev server

### Data Model
- Use the data model in @context/datamodel.md as base data model. 

## Testing
Currently no testing framework is configured. To add testing:
1. Install Jest and React Testing Library for unit/integration tests
2. Configure Jest for Next.js App Router compatibility  
3. Consider Playwright or Cypress for E2E testing
4. Add test scripts to package.json (`test`, `test:watch`, `test:e2e`)

## Project Status
This is a fresh Next.js project in initial setup phase. The foundation is established with:
- Modern tooling (Next.js 15, React 19, Tailwind v4)
- Comprehensive theming system with CSS variables
- shadcn/ui integration ready for component development
- TypeScript strict mode for type safety

**Ready for**: Feature development, component creation, API routes, business logic implementation