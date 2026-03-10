// ============================================
// Hook: useDebounce — debounce a value by delay
// ============================================

import { useState, useEffect } from "react"

/**
 * Returns a debounced version of the input value.
 * Useful for search inputs to avoid firing API requests on every keystroke.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
