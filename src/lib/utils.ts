import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ka-GE', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} კკალ`
}

export const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'წონის კლება',
  gain_muscle: 'კუნთოვანი მასის მომატება',
  maintain: 'წონის შენარჩუნება',
}

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'უმოძრაო (სამსახური + სახლი)',
  light: 'მსუბუქი (1-3 ვარჯიში/კვირა)',
  moderate: 'ზომიერი (3-5 ვარჯიში/კვირა)',
  active: 'აქტიური (6-7 ვარჯიში/კვირა)',
  very_active: 'ძალიან აქტიური (2x/დღე)',
}

export const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'დამწყები',
  intermediate: 'საშუალო',
  advanced: 'პროფესიონალი',
}

export const WORK_TYPE_LABELS: Record<string, string> = {
  desk: 'საოფისე სამუშაო',
  standing: 'მდგომარეობით',
  physical: 'ფიზიკური შრომა',
}
