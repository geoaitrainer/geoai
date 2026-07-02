import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { GOAL_LABELS } from '@/lib/utils'

// gemini-2.5-flash-lite is served via OpenRouter, not OpenAI — must keep the
// OpenRouter baseURL provider (a bare openai() call would hit the wrong API).
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'AI Trainer',
  },
})

// Strict output shape — generateObject forces the model to match this, so no
// fragile regex JSON extraction.
const recipeSchema = z.object({
  name: z.string().describe('კერძის კრეატიული და მადისაღმძვრელი ქართული დასახელება'),
  servings: z.number().describe('პორციის რაოდენობა (ჩვეულებრივ 1 ან 2)'),
  prep_minutes: z.number().describe('მომზადების დრო წუთებში'),
  cook_minutes: z.number().describe('თერმული დამუშავების დრო წუთებში'),
  ingredients: z.array(
    z.object({
      item: z.string().describe('ინგრედიენტის დასახელება ქართულად (მაგ: ქათმის ფილე, ისპანახი)'),
      amount: z.string().describe('ზუსტი მასა ან მოცულობა (მაგ: 150გ, 1 ჩ/კ, 2 კბილი)'),
    })
  ).describe('საჭირო ინგრედიენტების სია ზუსტი პროპორციებით'),
  steps: z.array(
    z.string().describe('დეტალური, ნაბიჯ-ნაბიჯ მომზადების ინსტრუქცია')
  ).describe('კულინარიული ნაბიჯები ტექნიკის მითითებით'),
  nutrition_per_serving: z.object({
    calories: z.number().describe('კალორიები ერთ პორციაზე'),
    protein_g: z.number().describe('ცილები (გრამი) ერთ პორციაზე'),
    fat_g: z.number().describe('ცხიმები (გრამი) ერთ პორციაზე'),
    carbs_g: z.number().describe('ნახშირწყლები (გრამი) ერთ პორციაზე'),
  }).describe('ერთ პორციის კვებითი ღირებულება'),
  tips: z.string().describe('კლინიკური ნუტრიციოლოგის რჩევა ამ კერძის სარგებლიანობაზე მითითებული მიზნისთვის და კულინარიული ლაიფჰაკი'),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ingredients } = await req.json()
  if (!ingredients?.trim()) return NextResponse.json({ error: 'No ingredients' }, { status: 400 })

  await connectDB()
  // Personalization is derived from the server-side profile, never trusted from
  // the client — the frontend only sends `ingredients`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = await Profile.findOne({ userId: session.user.id }).lean() as any
  const goal = profile ? (GOAL_LABELS[profile.goal as keyof typeof GOAL_LABELS] ?? 'ფორმის შენარჩუნება') : 'ფორმის შენარჩუნება'
  const calorieGoal = profile?.calorie_goal ?? 2000
  const allergies: string[] = profile?.allergies ?? []
  const likedFoods: string[] = profile?.liked_foods ?? []

  try {
    const result = await generateObject({
      model: openrouter('google/gemini-2.5-flash-lite'),
      schema: recipeSchema,
      // Cap output — one recipe is ~1k tokens; the SDK default (65k) exceeds the
      // OpenRouter credit budget and the request is rejected.
      maxOutputTokens: 2000,
      system: `შენ ხარ წამყვანი კლინიკური ნუტრიციოლოგი და ვარსკვლავური შეფ-მზარეული, რომელიც სპეციალიზებულია თანამედროვე ჯანსაღ კვებასა და ტრადიციულ/მოდერნიზებულ ქართულ სამზარეულოზე.
შენი ფუნქციაა შეადგინო უმაღლესი სიზუსტის რეცეპტები, რომლებიც იდეალურად პასუხობენ მომხმარებლის ფიტნეს მიზნებს, მკაცრად იცავენ ალერგიის უსაფრთხოებას და მაკრონუტრიენტების სწორ ბალანსს.`,
      prompt: `შექმენი პერსონალიზებული, ჯანსაღი რეცეპტი შემდეგი კრიტერიუმების მიხედვით:

### 1. შეყვანილი მონაცემები:
- ხელმისაწვდომი საბაზისო ინგრედიენტები: ${ingredients}
- მომხმარებლის მიზანი: ${goal}
- დღიური კალორიული ლიმიტი: ${calorieGoal} კკალ
- ალერგიები / აკრძალული პროდუქტები: ${allergies.length > 0 ? allergies.join(', ') : 'არ აქვს'}
- საყვარელი პროდუქტები / პრეფერენციები: ${likedFoods.length > 0 ? likedFoods.join(', ') : 'არ არის მითითებული'}

### 2. სავალდებულო კულინარიული და ნუტრიციული წესები:
- **კულინარიული ხელწერა:** შეინარჩუნე ბალანსი თანამედროვე ფიტნეს-დიეტოლოგიასა და ქართულ კულინარიულ კულტურას შორის. გამოიყენე ადგილობრივი მწვანილები (ქინძი, ოხრახუში, რეჰანი), ნიორი, სუნელები (უცხო სუნელი, ხმელი ქინძი), ან ნიგოზის/ბროწეულის ზომიერი დოზები, თუ ეს ერგება მოცემულ ინგრედიენტებს.
- **უსაფრთხოება (Allergies):** მკაცრად გამორიცხე მითითებული ალერგენები. თუ მომხმარებლის მიერ შემოთავაზებულ ინგრედიენტებში არის ალერგენი, ჩაანაცვლე ის უსაფრთხო ალტერნატივით და აღნიშნე ეს "tips"-ში.
- **მიზნობრივი მაკრონუტრიენტები:**
  - თუ მიზანია *კუნთების ზრდა*, აქცენტი გააკეთე მაღალ ცილაზე (Protein-dense).
  - თუ მიზანია *წონის დაკლება*, უზრუნველყავი დაბალკალორიული, ბოჭკოვანი ნივთიერებებით (Fiber) მდიდარი მოცულობითი კერძი.
- **მომზადების ტექნიკა:** "steps" მასივში აღწერე თერმული დამუშავების სწორი მეთოდები (ორთქლზე, მოშუშვა, გრილი ან გამოცხობა) და ნარჩენი სითბოს (Residual Heat) გამოყენება, რათა პროდუქტებმა მაქსიმალურად შეინარჩუნონ ვიტამინები.`,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error('Recipe Generation Error:', error)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
