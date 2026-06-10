import type { Profile } from '@/types/profile'

// Mifflin-St Jeor equation
export function calculateBMR(data: Pick<Profile, 'weight_kg' | 'height_cm' | 'age' | 'gender'>): number {
  const base = 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age
  return Math.round(data.gender === 'male' ? base + 5 : base - 161)
}
