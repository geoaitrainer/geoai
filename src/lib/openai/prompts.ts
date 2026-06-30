import type { Profile } from '@/types/profile'
import type { MealPlan } from '@/types/nutrition'
import type { WorkoutProgram } from '@/types/workout'
import { GOAL_LABELS } from '@/lib/utils'

export function buildChatSystemPrompt(
  profile: Profile,
  mealPlan?: MealPlan | null,
  workoutProgram?: WorkoutProgram | null
): string {
  const goalMap: Record<string, string> = {
    lose_weight: 'წონის დაკლება',
    gain_muscle: 'კუნთების ზრდა',
    maintain: 'ფორმის შენარჩუნება',
  }
  const expMap: Record<string, string> = {
    beginner: 'დამწყები',
    intermediate: 'საშუალო დონე',
    advanced: 'პროფესიონალი',
  }
  const bmi = profile.height_cm && profile.weight_kg
    ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
    : null

  const mealPlanSummary = mealPlan?.content?.days?.length
    ? `აქტიური კვების გეგმა: ${mealPlan.content.days.length}-დღიანი. დღ.1: ${mealPlan.content.days[0]?.meals?.breakfast?.name || '—'} (საუზმე), ${mealPlan.content.days[0]?.meals?.lunch?.name || '—'} (სადილი).`
    : 'კვების გეგმა: არ აქვს'

  const workoutSummary = workoutProgram?.content?.name
    ? `აქტიური ვარჯიშის პროგრამა: "${workoutProgram.content.name}", ${workoutProgram.content.days_per_week} ვარჯიში/კვირა, ${workoutProgram.content.duration_weeks} კვირა.`
    : 'ვარჯიშის პროგრამა: არ აქვს'

  return `შენ ხარ ${profile.name}-ის პირადი AI მწვრთნელი და კვების კონსულტანტი. ყოველთვის პასუხობ ქართულ ენაზე, მეგობრულად და კონკრეტულად.

## მომხმარებლის პროფილი
- სახელი: ${profile.name}
- სქესი: ${profile.gender === 'male' ? 'კაცი' : 'ქალი'}, ასაკი: ${profile.age} წელი
- წონა: ${profile.weight_kg}კგ, სიმაღლე: ${profile.height_cm}სმ${bmi ? `, BMI: ${bmi}` : ''}
- მიზანი: ${goalMap[profile.goal] || profile.goal}
- გამოცდილება: ${expMap[profile.experience] || profile.experience}
- დღ. კალორია: ${profile.calorie_goal}კკალ | ცილა: ${profile.protein_g}გ | ცხიმი: ${profile.fat_g}გ | ნახ: ${profile.carbs_g}გ
${profile.allergies?.length ? `- ალერგიები: ${profile.allergies.join(', ')}` : ''}
${profile.conditions?.length ? `- ჯანმრთელობის შეზღუდვები: ${profile.conditions.join(', ')}` : ''}
${profile.liked_foods?.length ? `- საყვარელი საკვები: ${profile.liked_foods.join(', ')}` : ''}
${profile.disliked_foods?.length ? `- არ მოსწონს: ${profile.disliked_foods.join(', ')}` : ''}
- დღ. ბიუჯეტი: ${profile.daily_budget}₾

## პლანები
${mealPlanSummary}
${workoutSummary}

## შენი როლი
1. **კვება**: კონკრეტული, პრაქტიკული რჩევები. გამოიყენე ქართული სამზარეულო (ხინკალი, ლობიო, ბადრიჯანი, მჭადი, ხაჭო და სხვ.). მაკრო-ბალანსი ${profile.calorie_goal}კკალ მიზნის მიხედვით.
2. **ვარჯიში**: რჩევები ${goalMap[profile.goal] || 'მიზნის'} და ${expMap[profile.experience] || 'გამოცდილების'} მიხედვით.
3. **პროგრესი**: მოტივაცია, ტენდენციების ანალიზი, კორექტირება.
4. **ზოგადი**: კითხვებზე — წყალი, ძილი, სტრესი, რესტავრაცია.

## წესები
- ყოველთვის პასუხობ ქართულ ენაზე
- კონკრეტული ციფრები, არა ბუნდოვანი რჩევები
- თუ სამედიცინო კითხვაა — ურჩიე ექიმი, მაგრამ საბაზისო ინფო მიეცი
- პასუხი მოკლე (3-6 წინადადება), თუ არ მოითხოვს სხვაგვარად`
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

მოთხოვნები:
- ყველა ტექსტი ქართულად (name, description, day_name, warmup, cooldown, notes, progression_notes, rest_activities)
- days მასივი შეიცავს ყველა 7 დღეს (კვირის სრული ციკლი)
- ვარჯიშის დღეები: is_rest = false, ავსებ exercises-ს
- დასვენების დღეები: is_rest = true, exercises = [], ავსებ rest_activities-ს შემდეგი ვარიანტებიდან: ცურვა, სეირნობა, განტვირთვა, წიგნის კითხვა, მედიტაცია, გაჭიმვა

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
      "is_rest": false,
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
    },
    {
      "day_number": 2,
      "day_name": "სამშაბათი — დასვენება",
      "is_rest": true,
      "muscle_groups": [],
      "exercises": [],
      "duration_minutes": 30,
      "rest_activities": [
        { "name": "სეირნობა", "duration": "30 წუთი", "notes": "მსუბუქი ტემპი, სუფთა ჰაერზე" },
        { "name": "წიგნის კითხვა", "duration": "1 საათი", "notes": "მოდუნება და ტვინის განტვირთვა" }
      ],
      "rest_notes": "დღეს სხეული განახლდება — ენერგია ნახვამდე!"
    }
  ],
  "progression_notes": "ყოველ 2 კვირაში გაზარდე დატვირთვა 5-10%"
}`
}

export function buildFoodLookupPrompt(foodName: string, amountG?: number): string {
  return `შეძებე ეს საკვები და მიეცი კვებითი ინფორმაცია:
საკვები: "${foodName}"${amountG ? `\nრაოდენობა: ${amountG}გ` : '\nრაოდენობა: 100გ'}

დააბრუნე მხოლოდ JSON:
{
  "food_name": "ზუსტი სახელი ქართულად",
  "amount_g": 100,
  "calories": 150,
  "protein_g": 10.5,
  "fat_g": 5.2,
  "carbs_g": 18.0,
  "found": true
}

თუ ვერ ცნე საკვები: "found": false, დანარჩენი 0.`
}

export function buildNutritionAnalysisPrompt(
  profile: Profile,
  entries: { food_name: string; calories: number; protein_g: number; fat_g: number; carbs_g: number; meal_type: string }[],
): string {
  const totals = entries.reduce((a, e) => ({
    cal: a.cal + (e.calories || 0),
    prot: a.prot + (e.protein_g || 0),
    fat: a.fat + (e.fat_g || 0),
    carbs: a.carbs + (e.carbs_g || 0),
  }), { cal: 0, prot: 0, fat: 0, carbs: 0 })

  return `გააანალიზე ${profile.name}-ის დღევანდელი კვება:

მიზანი: კალორია ${profile.calorie_goal}კკალ | ცილა ${profile.protein_g}გ | ცხიმი ${profile.fat_g}გ | ნახ ${profile.carbs_g}გ

შეჭამა:
${entries.map(e => `- ${e.meal_type}: ${e.food_name} (${Math.round(e.calories)}კკალ)`).join('\n')}

სულ: ${Math.round(totals.cal)}კკალ | ცილა:${Math.round(totals.prot)}გ | ცხიმი:${Math.round(totals.fat)}გ | ნახ:${Math.round(totals.carbs)}გ

მიეცი მოკლე ანალიზი (3-5 წინადადება) ქართულად:
1. რა კარგად გაკეთდა
2. სად არის ხარვეზი (ნაკლები ცილა? ზედმეტი ნახ?)
3. 1-2 კონკრეტური რეკომენდაცია დარჩენილი დღისთვის`
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
