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
  const exp = profile.experience
  const splitMap = {
    beginner:     { split: 'Full Body', days: 3, desc: 'სრული სხეული — კვირაში 3-ჯერ (ყოველი კუნთი 3-ჯერ)' },
    intermediate: { split: 'Upper/Lower', days: 4, desc: 'ზედა/ქვედა გაყოფა — კვირაში 4-ჯერ (ყოველი კუნთი 2-ჯერ)' },
    advanced:     { split: 'Push/Pull/Legs', days: 6, desc: 'Push/Pull/Legs — კვირაში 6-ჯერ (ყოველი კუნთი 2-ჯერ)' },
  }
  const split = splitMap[exp as keyof typeof splitMap] ?? splitMap.intermediate
  const expLabel = exp === 'beginner' ? 'დამწყები' : exp === 'intermediate' ? 'საშუალო' : 'პროფესიონალი'
  const rirLabel = exp === 'beginner' ? 'RIR 3-4 (RPE 6-7)' : exp === 'intermediate' ? 'RIR 2-3 (RPE 7-8)' : 'RIR 1-2 (RPE 8-9)'

  return `შექმენი პერსონალიზებული ${type === 'gym' ? 'სავარჯიშო დარბაზის' : 'სახლის'} ვარჯიშის პროგრამა NSCA სტანდარტების მიხედვით.

## მომხმარებლის მონაცემები
სახელი: ${profile.name}
სქესი: ${profile.gender === 'male' ? 'კაცი' : 'ქალი'} | ასაკი: ${profile.age} | წონა: ${profile.weight_kg}კგ | სიმაღლე: ${profile.height_cm ?? '?'}სმ
მიზანი: ${GOAL_LABELS[profile.goal]}
გამოცდილება: ${expLabel}
${profile.conditions?.length ? `შეზღუდვები/ტრავმები: ${profile.conditions.join(', ')}` : ''}

## მკაცრი სამეცნიერო პრინციპები (NSCA)
1. სპლიტი და სიხშირე: ${split.split} (${split.desc})
2. COMPOUND-FIRST: მრავალსახსრიანი ბაზისური ვარჯიშები ყოველთვის პირველია. იზოლაცია — ბოლოს.
3. RPE და RIR კონტროლი: ${rirLabel}
4. ტემპის წესი: ბაზისური "3-1-2-0" | იზოლაცია "2-0-2-0" (ეკცენტრიკა-პაუზა-კონცენტრიკა-ზედა)
5. 4-კვირიანი მესოციკლი (8 კვირაში მეორდება):
   - კვ.1-2 (Accumulation): მაღალი მოცულობა, ბაზისურზე RIR 3, იზოლაციაზე RIR 2
   - კვ.3 (Intensification): ინტენსივობის გაზრდა, RIR 1-2
   - კვ.4 (Deload): სეტები −50%, სამუშაო წონა −40%
   - კვ.5-8 (Block 2): ციკლი მეორდება +2.5კგ–+5კგ საწყისი წონებით
6. Progressive Overload: +2.5კგ ბაზისურზე ყოველ კვირა (გარდა დელოადისა). +1 სეტი ან +2 გამეორება იზოლაციაზე კვ.1→კვ.3

## ენობრივი მოთხოვნები (კრიტიკულია!)
- გამართული ქართული ლიტერატურული ენა — არა კალკი ინგლისურიდან
- მომხმარებელს მიმართე მხოლობითი II პირით: "დადექი", "გაშალე", "მოერიდე" (არა "დადექით")
- ტექნიკური ტერმინები ახსენი მარტივად — ილუსტრაციის გარეშე წარმოსახვადი

## სტრუქტურა
- days: ყველა 7 დღე (ვარჯიში + დასვენება)
- ვარჯიში: is_rest=false, 4-7 სავარჯიშო, compound_first=true
- დასვენება: is_rest=true, rest_activities: ცურვა / სეირნობა / განტვირთვა / წიგნის კითხვა / გაჭიმვა

დააბრუნე მხოლოდ ვალიდური JSON:
{
  "name": "პროგრამის დასახელება",
  "description": "მოკლე სამეცნიერო დასაბუთება — რატომ შეირჩა ეს მიდგომა",
  "split_type": "${split.split}",
  "duration_weeks": 8,
  "days_per_week": ${split.days},
  "deload_week": 4,
  "days": [
    {
      "day_number": 1,
      "day_name": "ორშაბათი — Push (მკერდი, მხარი, ტრიცეფსი)",
      "is_rest": false,
      "muscle_groups": ["მკერდი", "წინა მხარი", "ტრიცეფსი"],
      "warmup": "5 წუთი: ელიფსური ტრენაჟორი + მხრის წრიული მოძრაობები",
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
          "weight_suggestion": "1RM-ის 75% — RPE 8, ბოლო 2 გამეორება ძნელი",
          "notes": "ბიომექანიკა > წონა — ნელი ჩამოშვება ვალდებულია",
          "execution_details": {
            "setup": "დაწექი სკამზე, ზურგი ოდნავ მოხრილი (ბუნებრივი ლორდოზი), ფეხები მთლიანად იატაკზე. ბარბელი აიღე მხრების სიგანეზე ოდნავ გარედან, მაჯები გამართე.",
            "technique_steps": [
              "ჩასუნთქვაზე ნელა, 3 წამის განმავლობაში, ჩამოიყვანე ბარბელი გულმკერდის შუა ნაწილამდე.",
              "გულმკერდს შეეხე და გააკეთე 1 წამიანი პაუზა — ნუ ამოაჭიქუნებ.",
              "ამოსუნთქვაზე, 2 წამის განმავლობაში, ბარბელი ბიძგით ზემოთ ოდნავ წინ — სანამ იდაყვები სრულად არ გაიშლება."
            ],
            "target_sensation": "მოძრაობისას გულმკერდის კუნთებში დაძაბვა უნდა იგრძნობოდეს, განსაკუთრებით ჩამოშვებისას — ოდნავ წვა ნორმალურია.",
            "safety_errors": "მოერიდე ბარბელის ამოჭიქუნებას გულმკერდიდან. ქუსლები იატაკზე უნდა იყოს — ნუ ასწევ. ზურგი სავარძლის ზედა ნაწილს არ უნდა მოსწყდეს."
          }
        },
        {
          "name": "დუმბელის ტრიცეფსის გაშლა (Dumbbell Tricep Extension)",
          "is_compound": false,
          "sets": 3,
          "reps": "12-15",
          "rest_seconds": 60,
          "rpe": 7,
          "rir": 3,
          "tempo": "2-0-2-0",
          "weight_suggestion": "RPE 7 — ბოლო 3 გამეორება ოდნავ ძნელი",
          "notes": "სრული კონტრაქცია ზედა წერტილში — ნუ გააქანებ",
          "execution_details": {
            "setup": "სკამზე მჯდომარე ან მდგომარე, ერთი დუმბელი ორივე ხელით თავზე. იდაყვები ახლოს, ყურებთან.",
            "technique_steps": [
              "ჩასუნთქვაზე, 2 წამში, ნელა მოხარე იდაყვები — დუმბელი ჩამოდის თავის უკან.",
              "ამოსუნთქვაზე, 2 წამში, გაშალე იდაყვები ბოლომდე და ტრიცეფსი შეკუმში."
            ],
            "target_sensation": "ტრიცეფსის კუნთში წვა — მკლავის უკანა მხარეს.",
            "safety_errors": "იდაყვები გვერდზე ნუ გაიტყვეობს — ზევიდან ვერტიკალურად უნდა იყოს. ზედმეტად მძიმე წონა ზურგს ატვირთავს."
          }
        }
      ],
      "cooldown": "5 წუთი: მკერდი და ტრიცეფსი — კედელთან გაჭიმვა",
      "duration_minutes": 65,
      "rest_activities": []
    },
    {
      "day_number": 2,
      "day_name": "სამშაბათი — აქტიური დასვენება",
      "is_rest": true,
      "muscle_groups": [],
      "exercises": [],
      "duration_minutes": 30,
      "rest_activities": [
        { "name": "სეირნობა", "duration": "30-40 წუთი", "notes": "მსუბუქი ტემპი, სუფთა ჰაერზე — სისხლმიმოქცევა ააქტიურებს გამოჯანმრთელებას" },
        { "name": "გაჭიმვა", "duration": "15 წუთი", "notes": "გუშინდელი კუნთები გაშალე — მკერდი, ტრიცეფსი, მხარი" }
      ],
      "rest_notes": "სხეული ამ დღეს კუნთებს ააშენებს. დასვენება ისეთივე მნიშვნელოვანია, როგორც ვარჯიში. სვი 2.5+ ლ წყალი."
    }
  ],
  "progression_notes": "კვ.1-2: ბაზა — ტექნიკა ჯერ, შემდეგ წონა. კვ.3: ინტენსივობა — RPE +1. კვ.4: Deload — 50% სეტი, 60% წონა, ტექნიკის გათვალისწინება. კვ.5-8: +2.5კგ ბაზისურზე, +1 სეტი იზოლაციაზე. კვ.8: Peak — მაქსიმალური შედეგი."
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
