'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { useAppStore } from '@/store/app-store'

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { setUser } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      // Set user data in the store
      setUser({
        id: userId,
        email: '', // Will be updated with actual email from Clerk user data
        role: 'Radiologist',
        institutionId: 'inst-1'
      })
      
      // Redirect to dashboard
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, userId, setUser, router])

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Show sign in/up page if not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">SpineMeasure</h1>
            <p className="mt-2 text-muted-foreground">
              Advanced spine measurement and analysis application
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Get started
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <SignInButton mode="modal">
                <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                  Sign In
                </button>
              </SignInButton>
              
              <SignUpButton mode="modal">
                <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting authenticated users
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}