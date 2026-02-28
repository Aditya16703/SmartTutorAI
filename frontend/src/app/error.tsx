'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application Error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">{error.message || "An unexpected error occurred."}</p>
        <Button
          onClick={() => reset()}
          className="w-full"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
