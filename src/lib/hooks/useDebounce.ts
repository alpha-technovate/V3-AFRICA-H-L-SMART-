// src/lib/hooks/useDebounce.ts

import { useEffect, useState } from 'react';

/**
 * Hook to debounce a value, delaying its update until after a specific duration.
 * Useful for throttling API calls triggered by frequent state changes (e.g., typing).
 * * @param value The value to debounce (e.g., input form state).
 * @param delay The delay in milliseconds (e.g., 500ms).
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the previous timer if value changes before the delay is reached
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}