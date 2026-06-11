import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildFoodLookupPrompt } from '@/lib/openai/prompts'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { food_name, amount_g } = await request.json()
  if (!food_name) return NextResponse.json({ error: 'food_name required' }, { status: 400 })

  try {
    const prompt = buildFoodLookupPrompt(food_name, amount_g)
    const completion = await openaiClient.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: 'შენ ხარ კვების ექსპერტი. პასუხობ მხოლოდ ვალიდური JSON ფორმატით.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const result = JSON.parse(content)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Food lookup error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
