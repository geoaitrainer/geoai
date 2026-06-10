export interface ProgressEntry {
  id: string
  user_id: string
  date: string
  weight_kg?: number
  waist_cm?: number
  chest_cm?: number
  biceps_cm?: number
  photo_url?: string
  ai_review?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
