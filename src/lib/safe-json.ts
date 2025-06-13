/**
 * Safe JSON parsing utilities
 * These functions handle JSON parsing errors gracefully and prevent crashes
 */

/**
 * Safely parse JSON with error handling
 * @param jsonString - The JSON string to parse
 * @param fallback - Optional fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined,
  fallback?: T
): T | null {
  if (!jsonString) {
    return fallback ?? null
  }

  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('JSON parse error:', error)
    return fallback ?? null
  }
}

/**
 * Safely parse JSON from localStorage
 * @param key - The localStorage key
 * @param fallback - Optional fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeLocalStorageGet<T = any>(
  key: string,
  fallback?: T
): T | null {
  try {
    const item = localStorage.getItem(key)
    return safeJsonParse(item, fallback)
  } catch (error) {
    console.error('localStorage access error:', error)
    return fallback ?? null
  }
}

/**
 * Safely set JSON to localStorage
 * @param key - The localStorage key
 * @param value - The value to stringify and store
 * @returns Success boolean
 */
export function safeLocalStorageSet(
  key: string,
  value: any
): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('localStorage set error:', error)
    return false
  }
}

/**
 * Check if a string is valid JSON
 * @param str - The string to check
 * @returns Boolean indicating if string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
} 