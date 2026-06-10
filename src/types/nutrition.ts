export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type MealPlanType = '7day' | '30day'

export interface Meal {
  name: string
  ingredients: string[]
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  recipe?: string
  alternatives?: string[]
}

export interface DayPlan {
  day: number
  day_name: string
  meals: {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    snack?: Meal
  }
  total_calories: number
  total_protein_g: number
  total_fat_g: number
  total_carbs_g: number
}

export interface MealPlan {
  id: string
  user_id: string
  type: MealPlanType
  content: {
    days: DayPlan[]
    shopping_list: ShoppingItem[]
    notes: string
  }
  week_number?: number
  is_active: boolean
  created_at: string
}

export interface ShoppingItem {
  category: string
  item: string
  amount: string
  estimated_price?: number
}

export interface FoodDiaryEntry {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  food_name: string
  amount_g: number
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  photo_url?: string
  ai_assessment?: string
  created_at: string
}

export interface DailyMacros {
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
}
