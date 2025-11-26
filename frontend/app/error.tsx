'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error handler for Next.js App Router
 * Catches errors in the app and displays a user-friendly error page
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console (in production, send to monitoring service)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-8">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>

      <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>

      <p className="text-muted-foreground mb-8 max-w-md">
        We apologize for the inconvenience. An unexpected error has occurred.
        Please try again or return to the home page.
      </p>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
          size="lg"
        >
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 text-left w-full max-w-2xl">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Error details (development only)
          </summary>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Error Message:</p>
            <pre className="text-xs text-destructive mb-4 overflow-auto">
              {error.message}
            </pre>
            {error.digest && (
              <>
                <p className="text-sm font-medium mb-2">Error Digest:</p>
                <pre className="text-xs text-muted-foreground mb-4">
                  {error.digest}
                </pre>
              </>
            )}
            {error.stack && (
              <>
                <p className="text-sm font-medium mb-2">Stack Trace:</p>
                <pre className="text-xs overflow-auto max-h-48 text-muted-foreground">
                  {error.stack}
                </pre>
              </>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
