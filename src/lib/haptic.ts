type HapticType = 'light' | 'medium' | 'heavy' | 'success'

const PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 10],
}

export function haptic(type: HapticType = 'light'): void {
  if (!('vibrate' in navigator)) return
  navigator.vibrate(PATTERNS[type])
}
