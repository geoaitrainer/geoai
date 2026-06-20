import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'AI Trainer',
  },
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ingredients } = await request.json()
  if (!ingredients?.trim()) return NextResponse.json({ error: 'No ingredients' }, { status: 400 })

  await connectDB()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = await Profile.findOne({ userId: session.user.id }).lean() as any

  const prompt = `შექმენი ჯანსაღი რეცეპტი შემდეგი ინგრედიენტებიდან:
ინგრედიენტები: ${ingredients}

${profile ? `მომხმარებლის მიზანი: ${profile.goal === 'lose_weight' ? 'წონის დაკლება' : profile.goal === 'gain_muscle' ? 'კუნთების ზრდა' : 'ფორმის შენარჩუნება'}
დღ. კალორია: ${profile.calorie_goal}კკალ` : ''}

დააბრუნე მხოლოდ JSON:
{
  "name": "კერძის სახელი",
  "servings": 2,
  "prep_minutes": 15,
  "cook_minutes": 20,
  "ingredients": [
    { "item": "ქათამი", "amount": "300გ" }
  ],
  "steps": [
    "1. ...",
    "2. ..."
  ],
  "nutrition_per_serving": {
    "calories": 350,
    "protein_g": 28,
    "fat_g": 12,
    "carbs_g": 25
  },
  "tips": "კვებითი რჩევა"
}`

  try {
    const { text } = await generateText({
      model: openrouter('google/gemini-2.5-flash-lite'),
      prompt,
      maxOutputTokens: 1000,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI parse error' }, { status: 500 })
    const recipe = JSON.parse(jsonMatch[0])
    return NextResponse.json(recipe)
  } catch {
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
