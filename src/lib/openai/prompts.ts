import type { Profile } from '@/types/profile'
import type { MealPlan } from '@/types/nutrition'
import type { WorkoutProgram } from '@/types/workout'
import { GOAL_LABELS, ACTIVITY_LABELS } from '@/lib/utils'

export function buildChatSystemPrompt(
  profile: Profile,
  mealPlan?: MealPlan | null,
  workoutProgram?: WorkoutProgram | null
): string {
  return `შენ ხარ AI პირადი ტრენერი და კვების სპეციალისტი. ყოველთვის პასუხობ ქართულ ენაზე. ხარ მეგობრული, მოტივაციური და პროფესიონალი.

## მომხმარებლის მონაცემები
სახელი: ${profile.name}
ასაკი: ${profile.age} წელი
სქესი: ${profile.gender === 'male' ? 'მამრობითი' : 'მდედრობითი'}
სიმაღლე: ${profile.height_cm} სმ
წონა: ${profile.weight_kg} კგ
მიზანი: ${GOAL_LABELS[profile.goal]}
აქტივობა: ${ACTIVITY_LABELS[profile.activity_level]}

## კვებითი ნორმები
BMR: ${profile.bmr} კკალ
TDEE: ${profile.tdee} კკალ
დღიური კალორია: ${profile.calorie_goal} კკალ
ცილები: ${profile.protein_g}გ
ცხიმები: ${profile.fat_g}გ
ნახშირწყლები: ${profile.carbs_g}გ

${profile.allergies?.length ? `ალერგიები: ${profile.allergies.join(', ')}` : ''}
${profile.conditions?.length ? `ჯანმრთელობის თავისებურებები: ${profile.conditions.join(', ')}` : ''}

${mealPlan ? `## მიმდინარე კვების გეგმა\nაქტიური ${mealPlan.type === '7day' ? '7-დღიანი' : '30-დღიანი'} გეგმა შედგენილია.` : ''}
${workoutProgram ? `## მიმდინარე ვარჯიშის პროგრამა\nაქტიური ${workoutProgram.type === 'gym' ? 'დარბაზის' : 'სახლის'} პროგრამა (${workoutProgram.level === 'beginner' ? 'დამწყები' : workoutProgram.level === 'intermediate' ? 'საშუალო' : 'პროფესიონალი'} დონე).` : ''}

## მნიშვნელოვანი წესები
1. ყოველთვის პასუხობ ქართულ ენაზე
2. სამედიცინო კითხვებზე მიმართე ექიმს
3. კალორიების ზღვარი: ქალი მინ. 1200 კკალ, კაცი მინ. 1500 კკალ
4. რეკომენდაციები ეფუძნება მეცნიერულ სტანდარტებს
5. ხარ მოტივაციური და მხარდამჭერი
6. გამოიყენე ქართული საკვები პროდუქტები სადაც შესაძლებელია`
}

export function buildMealPlanPrompt(profile: Profile, days: number): string {
  const weekdays = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა']

  return `შექმენი ${days}-დღიანი კვების გეგმა შემდეგი მომხმარებლისთვის:

სახელი: ${profile.name}
სქესი: ${profile.gender === 'male' ? 'კაცი' : 'ქალი'}, ასაკი: ${profile.age}
წონა: ${profile.weight_kg}კგ, სიმაღლე: ${profile.height_cm}სმ
მიზანი: ${GOAL_LABELS[profile.goal]}
დღიური კალორია: ${profile.calorie_goal} კკალ
ცილები: ${profile.protein_g}გ | ცხიმები: ${profile.fat_g}გ | ნახშირწყლები: ${profile.carbs_g}გ
${profile.allergies?.length ? `ალერგიები: ${profile.allergies.join(', ')}` : ''}
${profile.liked_foods?.length ? `საყვარელი: ${profile.liked_foods.join(', ')}` : ''}
${profile.disliked_foods?.length ? `არასასურველი: ${profile.disliked_foods.join(', ')}` : ''}
დღიური ბიუჯეტი: ${profile.daily_budget} ₾

მოთხოვნები:
- გამოიყენე ქართული კერძები (ხინკალი, ხაჭაპური, ლობიანი, ჩაქაფული, სოკოს კერძები, ლობიო, მჭადი და სხვ.)
- ჩართე ზღვის პროდუქტები, ქათმის ხორცი, კვერცხი, ხაჭო, ხაჭო, კოტეჯი
- ყოველ დღეს: საუზმე, სადილი, ვახშამი, 1 სნეკი
- მიახლოვე კალორიები და მაკრო ნორმებთან ±50კკალ

დააბრუნე JSON ფორმატით:
{
  "days": [
    {
      "day": 1,
      "day_name": "${weekdays[0]}",
      "meals": {
        "breakfast": { "name": "კერძის სახელი", "ingredients": ["..."], "calories": 400, "protein_g": 25, "fat_g": 12, "carbs_g": 45, "recipe": "მოკლე რეცეპტი", "alternatives": ["..."] },
        "lunch": { ... },
        "dinner": { ... },
        "snack": { ... }
      },
      "total_calories": ${profile.calorie_goal},
      "total_protein_g": ${profile.protein_g},
      "total_fat_g": ${profile.fat_g},
      "total_carbs_g": ${profile.carbs_g}
    }
  ],
  "shopping_list": [
    { "category": "ხორცი", "item": "ქათმის ფილე", "amount": "500გ", "estimated_price": 12 }
  ],
  "notes": "ზოგადი რეკომენდაციები"
}`
}

export function buildWorkoutPlanPrompt(profile: Profile, type: 'gym' | 'home'): string {
  return `შექმენი ${type === 'gym' ? 'სავარჯიშო დარბაზის' : 'სახლის'} ვარჯიშის პროგრამა:

მომხმარებელი: ${profile.name}
სქესი: ${profile.gender === 'male' ? 'კაცი' : 'ქალი'}, ასაკი: ${profile.age}
წონა: ${profile.weight_kg}კგ
მიზანი: ${GOAL_LABELS[profile.goal]}
გამოცდილება: ${profile.experience === 'beginner' ? 'დამწყები' : profile.experience === 'intermediate' ? 'საშუალო' : 'პროფესიონალი'}
${profile.conditions?.length ? `შეზღუდვები: ${profile.conditions.join(', ')}` : ''}

დააბრუნე JSON:
{
  "name": "პროგრამის სახელი",
  "description": "მოკლე აღწერა",
  "duration_weeks": 8,
  "days_per_week": 4,
  "days": [
    {
      "day_number": 1,
      "day_name": "მკერდი და ტრიცეფსი",
      "muscle_groups": ["მკერდი", "ტრიცეფსი"],
      "warmup": "5 წუთი ელფსური",
      "exercises": [
        {
          "name": "საწოლი პრესი",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "notes": "ნელი ნეგატიური ფაზა",
          "weight_suggestion": "საკუთარი წონის 60%"
        }
      ],
      "cooldown": "გაჭიმვა 5 წუთი",
      "duration_minutes": 60
    }
  ],
  "progression_notes": "ყოველ 2 კვირაში გაზარდე დატვირთვა 5-10%"
}`
}

export function buildProgressReviewPrompt(
  profile: Profile,
  entries: { date: string; weight_kg?: number }[]
): string {
  const recentEntries = entries.slice(-4)
  return `შეაფასე ${profile.name}-ის კვირეული პროგრესი:

მიზანი: ${GOAL_LABELS[profile.goal]}
საწყისი წონა: ${profile.weight_kg}კგ

ბოლო ჩანაწერები:
${recentEntries.map(e => `${e.date}: ${e.weight_kg || '—'}კგ`).join('\n')}

მიეცი:
1. პროგრესის შეფასება
2. ტენდენციის ანალიზი
3. კონკრეტური რეკომენდაციები
4. მოტივაციური გზავნილი

პასუხი ქართულ ენაზე, 150-200 სიტყვა.`
}
