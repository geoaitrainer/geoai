export type WorkoutType = 'gym' | 'home'
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
  weight_suggestion?: string
  video_url?: string
}

export interface WorkoutDay {
  day_number: number
  day_name: string
  muscle_groups: string[]
  exercises: Exercise[]
  warmup?: string
  cooldown?: string
  duration_minutes: number
}

export interface WorkoutProgram {
  id: string
  user_id: string
  type: WorkoutType
  level: WorkoutLevel
  content: {
    name: string
    description: string
    duration_weeks: number
    days_per_week: number
    days: WorkoutDay[]
    progression_notes: string
  }
  is_active: boolean
  created_at: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  program_id?: string
  date: string
  day_name: string
  exercises_done: {
    exercise_name: string
    sets_completed: number
    reps_completed: string
    weight_used?: string
    notes?: string
  }[]
  notes?: string
  created_at: string
}
