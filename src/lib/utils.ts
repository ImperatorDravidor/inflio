import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Count characters for social media platforms with platform-specific rules
 */
export function countCharacters(text: string, platform: string): number {
  if (platform === 'x' || platform === 'twitter') {
    // X/Twitter specific counting rules
    let count = 0
    
    // Split text into segments to handle URLs separately
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const segments = text.split(urlRegex)
    
    for (const segment of segments) {
      if (segment.match(urlRegex)) {
        // URLs always count as 23 characters due to t.co wrapping
        count += 23
      } else {
        // Count emojis and CJK characters as 2, others as 1
        for (const char of segment) {
          if (isEmoji(char) || isCJK(char)) {
            count += 2
          } else {
            count += 1
          }
        }
      }
    }
    
    return count
  }
  
  // For all other platforms, use standard character count
  return text.length
}

/**
 * Check if a character is an emoji
 */
function isEmoji(char: string): boolean {
  // Emoji ranges in Unicode
  const emojiRanges = [
    [0x1F600, 0x1F64F], // Emoticons
    [0x1F300, 0x1F5FF], // Misc Symbols and Pictographs
    [0x1F680, 0x1F6FF], // Transport and Map
    [0x1F1E0, 0x1F1FF], // Regional Indicator Symbols
    [0x2600, 0x26FF],   // Misc symbols
    [0x2700, 0x27BF],   // Dingbats
    [0xFE00, 0xFE0F],   // Variation Selectors
    [0x1F900, 0x1F9FF], // Supplemental Symbols and Pictographs
    [0x1F018, 0x1F270], // Various symbols
  ]
  
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  
  return emojiRanges.some(([start, end]) => codePoint >= start && codePoint <= end)
}

/**
 * Check if a character is CJK (Chinese, Japanese, Korean)
 */
function isCJK(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  
  // CJK Unicode ranges
  return (
    (codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||   // CJK Unified Ideographs
    (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||   // CJK Extension A
    (codePoint >= 0x20000 && codePoint <= 0x2A6DF) || // CJK Extension B
    (codePoint >= 0x2A700 && codePoint <= 0x2B73F) || // CJK Extension C
    (codePoint >= 0x2B740 && codePoint <= 0x2B81F) || // CJK Extension D
    (codePoint >= 0x3040 && codePoint <= 0x309F) ||   // Hiragana
    (codePoint >= 0x30A0 && codePoint <= 0x30FF) ||   // Katakana
    (codePoint >= 0xAC00 && codePoint <= 0xD7AF)      // Hangul Syllables
  )
}

/**
 * Get platform-specific character limit
 */
export function getPlatformLimit(platform: string): number {
  const limits: Record<string, number> = {
    instagram: 2200,
    facebook: 63206,
    x: 280,
    twitter: 280,
    linkedin: 1300,
    linkedin_company: 700,
    tiktok: 2200,
    youtube: 5000,
    youtube_short: 100,
    threads: 500
  }
  
  return limits[platform] || 1000
}

/**
 * Get platform-specific hashtag limit
 */
export function getPlatformHashtagLimit(platform: string): number {
  const limits: Record<string, number> = {
    instagram: 30,
    facebook: 0,
    x: 0, // Hashtags count towards character limit
    twitter: 0,
    linkedin: 3,
    tiktok: 8,
    youtube: 15,
    threads: 0
  }
  
  return limits[platform] || 5
}

/**
 * Get preview length for platforms that truncate
 */
export function getPlatformPreviewLength(platform: string): number | null {
  const previewLengths: Record<string, number> = {
    instagram: 125, // Visible before "more"
    youtube: 157,   // Key info should be in first 157 chars
    facebook: 125   // For ads, primary text should be ~125
  }
  
  return previewLengths[platform] || null
}
