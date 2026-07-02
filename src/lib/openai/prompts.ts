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

export const MEAL_WEEKDAYS = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა']

function mealProfileBlock(profile: Profile, workoutRoutine?: string): string {
  return `## მომხმარებლის მონაცემები
სახელი: ${profile.name} | სქესი: ${profile.gender === 'male' ? 'კაცი' : 'ქალი'} | ასაკი: ${profile.age} წელი
წონა: ${profile.weight_kg}კგ | სიმაღლე: ${profile.height_cm}სმ | მიზანი: ${GOAL_LABELS[profile.goal]}
${workoutRoutine ? `ვარჯიშის გეგმა: ${workoutRoutine}` : ''}
დღიური კალორია: ${profile.calorie_goal} კკალ (±50) | ცილა ${profile.protein_g}გ | ცხიმი ${profile.fat_g}გ | ნახ ${profile.carbs_g}გ
${profile.allergies?.length ? `ალერგიები/შეზღუდვები: ${profile.allergies.join(', ')}` : ''}
${profile.liked_foods?.length ? `საყვარელი: ${profile.liked_foods.join(', ')}` : ''}
${profile.disliked_foods?.length ? `არასასურველი: ${profile.disliked_foods.join(', ')}` : ''}`
}

/**
 * Single-day meal prompt. Kept small so the JSON always fits inside the
 * model's output window — the multi-day plan is built by generating each day
 * separately and merging (see /api/ai/meal-plan). `avoidDishes` lists names
 * already used on other days so the week stays varied.
 */
// Rotating themes so independently-generated days don't all converge on the
// same dishes (e.g. oatmeal every breakfast).
export const MEAL_BREAKFAST_BASES = ['შვრია', 'კვერცხი/ომლეტი', 'ხაჭო/მაწონი', 'ბლინი/მჭადი', 'სმუზი/ფაფა', 'ავოკადო-ტოსტი', 'ყველიანი კერძი']
export const MEAL_PROTEIN_THEMES = ['ქათამი', 'საქონლის მჭლე ხორცი', 'თევზი/ზღვის პროდუქტი', 'ინდაური', 'პარკოსანი/ლობიო', 'კვერცხი/რძის ცილა', 'ღორის მჭლე ხორცი']

export function buildSingleDayMealPrompt(
  profile: Profile,
  dayNumber: number,
  dayName: string,
  workoutRoutine?: string,
  avoidDishes?: string[],
): string {
  const breakfastBase = MEAL_BREAKFAST_BASES[(dayNumber - 1) % MEAL_BREAKFAST_BASES.length]
  const proteinTheme = MEAL_PROTEIN_THEMES[(dayNumber - 1) % MEAL_PROTEIN_THEMES.length]
  return `შენ ხარ კლინიკური დიეტოლოგი. შექმენი 1 დღის (${dayName}) კვების მენიუ.

${mealProfileBlock(profile, workoutRoutine)}

## მოთხოვნები
- ჰორმონალური ოპტიმიზაცია: თუთია, მაგნიუმი, D3, ჯანსაღი ცხიმები (გოგრის თესლი, ნიგოზი, ისპანახი, კვერცხის გული, ცხიმიანი თევზი, მჭლე ხორცი, მუქი მწვანე ბოსტნეული)
- ვარჯიშის შემდგომი აღდგენა: მაღალი ბიოლოგიური ღირებულების ცილა + კომპლექსური ნახშირწყლები
- ქართული სამზარეულო (ხინკალი, მჭადი, ლობიო, ჩაქაფული, მაწონი, სულგუნი), ჯანსაღი მომზადება (გამოცხობა, ორთქლი, მინიმალური ზეთი)
- **მრავალფეროვნება (ამ დღისთვის):** საუზმის საფუძველი — ${breakfastBase}; მთავარი ცილის წყარო სადილ/ვახშამზე — ${proteinTheme}. არ გაიმეორო ტიპური "შვრიის ფაფა" თუ დღის საფუძველი სხვაა.
- მთელი ტექსტი ქართულად. ingredients = სტრინგების მასივი ("კვერცხი 2 ცალი (120გ)") — არა ობიექტები
- recipe = ნაბიჯ-ნაბიჯ ("ნაბიჯი 1: ... ნაბიჯი 2: ...", მინ 3 ნაბიჯი)
- alternatives = 2 ობიექტი ზუსტი მაკროებით (ყველა კვებას)
- 4 კვება: breakfast, lunch, dinner, snack. ჯამი ≈ ${profile.calorie_goal} კკალ
${avoidDishes?.length ? `- არ გაიმეორო ეს კერძები: ${avoidDishes.join(', ')}` : ''}

დააბრუნე მხოლოდ ვალიდური JSON (ერთი დღე):
{
  "day": ${dayNumber},
  "day_name": "${dayName}",
  "meals": {
    "breakfast": { "name": "", "ingredients": ["კვერცხი 2 ცალი (120გ)", "ისპანახი (60გ)"], "calories": 420, "protein_g": 28, "fat_g": 16, "carbs_g": 38, "recipe": "ნაბიჯი 1: ... ნაბიჯი 2: ... ნაბიჯი 3: ...", "alternatives": [{ "name": "", "calories": 410, "protein_g": 26, "fat_g": 14, "carbs_g": 42 }, { "name": "", "calories": 380, "protein_g": 24, "fat_g": 15, "carbs_g": 30 }] },
    "lunch": { "name": "", "ingredients": [], "calories": 700, "protein_g": 50, "fat_g": 22, "carbs_g": 80, "recipe": "ნაბიჯი 1: ...", "alternatives": [] },
    "dinner": { "name": "", "ingredients": [], "calories": 600, "protein_g": 45, "fat_g": 20, "carbs_g": 60, "recipe": "ნაბიჯი 1: ...", "alternatives": [] },
    "snack": { "name": "", "ingredients": [], "calories": 250, "protein_g": 20, "fat_g": 8, "carbs_g": 22, "recipe": "ნაბიჯი 1: ...", "alternatives": [] }
  },
  "total_calories": ${profile.calorie_goal},
  "total_protein_g": ${profile.protein_g},
  "total_fat_g": ${profile.fat_g},
  "total_carbs_g": ${profile.carbs_g}
}`
}

/**
 * Builds the aggregated shopping list + clinical notes from the ingredient
 * lines of all generated days. One small call, always fits.
 */
export function buildMealSummaryPrompt(
  profile: Profile,
  days: number,
  allIngredients: string[],
  workoutRoutine?: string,
): string {
  return `შენ ხარ კლინიკური დიეტოლოგი. ქვემოთ ${days}-დღიანი კვების გეგმის ინგრედიენტებია. შეაჯამე სავაჭრო სიად და დაწერე კლინიკური რეკომენდაციები.

${mealProfileBlock(profile, workoutRoutine)}
დღიური ბიუჯეტი: ${profile.daily_budget} ₾ | სულ დღე: ${days}

## ინგრედიენტები (ყველა დღე)
${allIngredients.join('\n')}

## მოთხოვნები
- დააჯგუფე კატეგორიებად, შეკრიბე იგივე პროდუქტის რაოდენობები
- estimated_price_gel: საქართველოს რეალური საბაზრო ფასი. ჯამური ÷ ${days} ≤ ${profile.daily_budget}₾/დღე
- clinical_and_lifestyle_notes: ჰორმონალური ბალანსი, კორტიზოლის მართვა, წყლის რეჟიმი, ვარჯიშის შემდგომი 30-60წთ ფანჯარა, ძილი-აღდგენა

დააბრუნე მხოლოდ ვალიდური JSON:
{
  "shopping_list": [
    { "category": "ხორცი და თევზი", "item": "ქათმის ფილე", "amount": "2.5 კგ", "estimated_price_gel": 35.00 }
  ],
  "clinical_and_lifestyle_notes": ""
}`
}

export interface WorkoutSplit {
  split: string
  days: number
  expLabel: string
  rirLabel: string
}

export function getWorkoutSplit(profile: Profile): WorkoutSplit {
  const exp = profile.experience
  const splitMap = {
    beginner:     { split: 'Full Body', days: 3, desc: 'სრული სხეული — კვირაში 3-ჯერ' },
    intermediate: { split: 'Upper/Lower', days: 4, desc: 'ზედა/ქვედა — კვირაში 4-ჯერ' },
    advanced:     { split: 'Push/Pull/Legs', days: 6, desc: 'Push/Pull/Legs — კვირაში 6-ჯერ' },
  }
  const s = splitMap[exp as keyof typeof splitMap] ?? splitMap.intermediate
  return {
    split: s.split,
    days: s.days,
    expLabel: exp === 'beginner' ? 'დამწყები' : exp === 'intermediate' ? 'საშუალო' : 'პროფესიონალი',
    rirLabel: exp === 'beginner' ? 'RIR 3-4 (RPE 6-7)' : exp === 'intermediate' ? 'RIR 2-3 (RPE 7-8)' : 'RIR 1-2 (RPE 8-9)',
  }
}

/**
 * Program "shell": metadata + all 7 day headers (day_name, muscle_groups,
 * warmup, cooldown, is_rest, rest_activities) but WITHOUT exercises. Exercises
 * are generated per workout-day separately so no single response truncates.
 */
export function buildWorkoutShellPrompt(profile: Profile, type: 'gym' | 'home'): string {
  const s = getWorkoutSplit(profile)
  return `შექმენი ${type === 'gym' ? 'სავარჯიშო დარბაზის' : 'სახლის'} ვარჯიშის პროგრამის ჩონჩხი NSCA სტანდარტით.

## მომხმარებელი
${profile.name} | ${profile.gender === 'male' ? 'კაცი' : 'ქალი'} | ${profile.age}წ | ${profile.weight_kg}კგ | ${profile.height_cm ?? '?'}სმ
მიზანი: ${GOAL_LABELS[profile.goal]} | გამოცდილება: ${s.expLabel}
${profile.conditions?.length ? `შეზღუდვები/ტრავმები: ${profile.conditions.join(', ')}` : ''}

## პრინციპები
- სპლიტი: ${s.split} (${s.days} სავარჯიშო დღე კვირაში)
- ${s.days} workout დღე + ${7 - s.days} დასვენება = სულ 7 დღე
- workout დღეებზე ლოგიკური კუნთოვანი ჯგუფების განაწილება (compound-first მიდგომისთვის)

## მოთხოვნა
დააბრუნე მხოლოდ ჩონჩხი — exercises მასივი ცარიელი დატოვე (შემდეგ შეივსება).
- workout დღე: is_rest=false, muscle_groups, warmup (5წთ), cooldown (5წთ), duration_minutes, exercises: []
- დასვენება: is_rest=true, muscle_groups: [], exercises: [], rest_activities (2-3: სეირნობა/ცურვა/გაჭიმვა/განტვირთვა), rest_notes
- ქართული, მხოლობითი II პირი

დააბრუნე მხოლოდ ვალიდური JSON:
{
  "name": "პროგრამის დასახელება",
  "description": "მოკლე სამეცნიერო დასაბუთება",
  "split_type": "${s.split}",
  "duration_weeks": 8,
  "days_per_week": ${s.days},
  "deload_week": 4,
  "days": [
    { "day_number": 1, "day_name": "ორშაბათი — Push (მკერდი, მხარი, ტრიცეფსი)", "is_rest": false, "muscle_groups": ["მკერდი", "მხარი", "ტრიცეფსი"], "warmup": "5 წუთი: ...", "cooldown": "5 წუთი: ...", "duration_minutes": 65, "exercises": [], "rest_activities": [] },
    { "day_number": 2, "day_name": "სამშაბათი — აქტიური დასვენება", "is_rest": true, "muscle_groups": [], "exercises": [], "duration_minutes": 30, "rest_activities": [{ "name": "სეირნობა", "duration": "30-40 წუთი", "notes": "..." }], "rest_notes": "..." }
  ],
  "progression_notes": "კვ.1-2: Accumulation. კვ.3: Intensification RPE+1. კვ.4: Deload −50% სეტი/−40% წონა. კვ.5-8: +2.5კგ ბაზისურზე."
}`
}

/**
 * Exercises + full execution_details for ONE workout day. Small enough that
 * the JSON never truncates.
 */
export function buildWorkoutDayPrompt(
  profile: Profile,
  type: 'gym' | 'home',
  dayName: string,
  muscleGroups: string[],
): string {
  const s = getWorkoutSplit(profile)
  return `შენ ხარ NSCA CSCS კოჩი. შეადგინე ერთი ${type === 'gym' ? 'დარბაზის' : 'სახლის'} ვარჯიშის დღის სავარჯიშოები.

დღე: ${dayName}
სამიზნე კუნთები: ${muscleGroups.join(', ') || 'სრული სხეული'}
გამოცდილება: ${s.expLabel} | RPE/RIR: ${s.rirLabel}

## პრინციპები
- COMPOUND-FIRST: მრავალსახსრიანი ბაზისური ვარჯიშები პირველ ადგილზე, იზოლაცია ბოლოს
- ტემპი: ბაზისური "3-1-2-0" | იზოლაცია "2-0-2-0"
- 4-7 სავარჯიში ამ დღისთვის
- ${type === 'home' ? 'სახლის პირობები: საკუთარი წონა, რეზინები, დუმბელები' : 'დარბაზის ინვენტარი: ბარბელი, დუმბელი, ტრენაჟორები'}

## ენობრივი მოთხოვნები (კრიტიკულია!)
- გამართული ქართული ლიტერატურული ენა — არა კალკი ინგლისურიდან
- მხოლობითი II პირი: "დადექი", "გაშალე", "მოერიდე"
- ყოველ სავარჯიშოზე execution_details: setup, technique_steps (3-4 ნაბიჯი), target_sensation, safety_errors

დააბრუნე მხოლოდ ვალიდური JSON (მასივი "exercises" გასაღებით):
{
  "exercises": [
    {
      "name": "ბარბელის ჩასმული პრესი (Barbell Bench Press)",
      "is_compound": true,
      "sets": 4,
      "reps": "6-8",
      "rest_seconds": 120,
      "rpe": 8,
      "rir": 2,
      "tempo": "3-1-2-0",
      "weight_suggestion": "1RM-ის 75% — RPE 8",
      "notes": "ბიომექანიკა > წონა",
      "execution_details": {
        "setup": "დაწექი სკამზე, ზურგი ოდნავ მოხრილი, ფეხები იატაკზე. ბარბელი აიღე მხრების სიგანეზე ოდნავ გარედან.",
        "technique_steps": ["ჩასუნთქვაზე 3 წამში ჩამოიყვანე ბარბელი გულმკერდამდე.", "1 წამიანი პაუზა — ნუ ამოაჭიქუნებ.", "ამოსუნთქვაზე 2 წამში ასწიე სანამ იდაყვები გაიშლება."],
        "target_sensation": "დაძაბვა გულმკერდის კუნთებში, განსაკუთრებით ჩამოშვებისას.",
        "safety_errors": "ნუ ამოაჭიქუნებ ბარბელს. ქუსლები იატაკზე. ზურგი სავარძელს არ მოსწყდეს."
      }
    }
  ]
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
