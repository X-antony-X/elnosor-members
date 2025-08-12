"use client"

import { useState, useCallback } from "react"

interface ErrorState {
  error: Error | null
  isError: boolean
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  })

  const handleError = useCallback((error: Error) => {
    console.error("Error handled:", error)

    // Log to external service if needed
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    console.error("Error logged:", errorData)

    setErrorState({ error, isError: true })
  }, [])

  const clearError = useCallback(() => {
    setErrorState({ error: null, isError: false })
  }, [])

  const retry = useCallback(
    (retryFn?: () => void) => {
      clearError()
      if (retryFn) {
        try {
          retryFn()
        } catch (error) {
          handleError(error as Error)
        }
      }
    },
    [clearError, handleError],
  )

  return {
    error: errorState.error,
    isError: errorState.isError,
    handleError,
    clearError,
    retry,
  }
}
