export type Gender = 'male' | 'female'
export type Goal = 'lose_weight' | 'gain_muscle' | 'maintain'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type WorkType = 'desk' | 'standing' | 'physical'
export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type SubscriptionPlan = 'free' | 'pro' | 'premium'

export interface Profile {
  id: string
  name: string
  age: number
  gender: Gender
  height_cm: number
  weight_kg: number
  goal: Goal
  activity_level: ActivityLevel
  work_type: WorkType
  experience: Experience
  allergies: string[]
  conditions: string[]
  liked_foods: string[]
  disliked_foods: string[]
  daily_budget: number
  bmr: number
  tdee: number
  calorie_goal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  plan: SubscriptionPlan
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
  name: string
  age: number
  gender: Gender
  height_cm: number
  weight_kg: number
  goal: Goal
  activity_level: ActivityLevel
  work_type: WorkType
  experience: Experience
  allergies: string[]
  conditions: string[]
  liked_foods: string[]
  disliked_foods: string[]
  daily_budget: number
}
