import type { Goal, Gender } from '@/types/profile'

interface MacroResult {
  calorie_goal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

const CALORIE_FLOOR: Record<Gender, number> = { male: 1500, female: 1200 }

export function calculateMacros(tdee: number, goal: Goal, gender: Gender): MacroResult {
  let calorie_goal: number

  if (goal === 'lose_weight') calorie_goal = tdee - 500
  else if (goal === 'gain_muscle') calorie_goal = tdee + 300
  else calorie_goal = tdee

  // Enforce calorie floor
  calorie_goal = Math.max(calorie_goal, CALORIE_FLOOR[gender])

  let proteinPct: number, fatPct: number, carbsPct: number

  if (goal === 'lose_weight') {
    proteinPct = 0.40; fatPct = 0.30; carbsPct = 0.30
  } else if (goal === 'gain_muscle') {
    proteinPct = 0.30; fatPct = 0.25; carbsPct = 0.45
  } else {
    proteinPct = 0.25; fatPct = 0.30; carbsPct = 0.45
  }

  return {
    calorie_goal: Math.round(calorie_goal),
    protein_g: Math.round((calorie_goal * proteinPct) / 4),
    fat_g: Math.round((calorie_goal * fatPct) / 9),
    carbs_g: Math.round((calorie_goal * carbsPct) / 4),
  }
}
