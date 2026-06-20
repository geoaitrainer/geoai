'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Recipe {
  name: string
  servings: number
  prep_minutes: number
  cook_minutes: number
  ingredients: { item: string; amount: string }[]
  steps: string[]
  nutrition_per_serving: {
    calories: number
    protein_g: number
    fat_g: number
    carbs_g: number
  }
  tips?: string
}

const INGREDIENT_SUGGESTIONS = [
  'კვერცხი, ხაჭო, მწვანილი',
  'ქათამი, ბრინჯი, ბოსტნეული',
  'ლობიო, ნიორი, ქინძი',
  'ბადრიჯანი, პომიდორი, ყველი',
  'ნიგოზი, ისპანახი, ნიორი',
  'თევზი, ლიმონი, სანელებლები',
]

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!ingredients.trim()) return
    setGenerating(true)
    setError('')
    setRecipe(null)

    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setRecipe(data)
    } catch {
      setError('შეცდომა. სცადეთ ხელახლა.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="რეცეპტების გენერატორი" subtitle="ინგრედიენტებიდან → AI რეცეპტი + კალორიები" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="label">რა გაქვს სახლში? 🥕</label>
              <textarea
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="მაგ: ქათამი, ბრინჯი, პომიდორი, ნიორი, ზეითუნის ზეთი..."
                rows={3}
                className="input-field w-full resize-none mt-1"
              />
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">სწრაფი შაბლონები:</p>
              <div className="flex gap-2 flex-wrap">
                {INGREDIENT_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setIngredients(s)}
                    className="text-xs px-2 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={generate} loading={generating} disabled={!ingredients.trim()}>
              {generating ? '🤖 AI ფიქრობს...' : '✨ რეცეპტის გენერაცია'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {recipe && (
          <div className="space-y-4 animate-slide-up">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{recipe.name}</CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="default">🍽 {recipe.servings} პორცია</Badge>
                      <Badge variant="default">⏱ {recipe.prep_minutes + recipe.cook_minutes} წთ</Badge>
                      <Badge variant="calories">🔥 {recipe.nutrition_per_serving.calories} კკალ/პ</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="protein">ც: {recipe.nutrition_per_serving.protein_g}გ</Badge>
                  <Badge variant="fat">ც: {recipe.nutrition_per_serving.fat_g}გ</Badge>
                  <Badge variant="carbs">ნ: {recipe.nutrition_per_serving.carbs_g}გ</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">🛒 ინგრედიენტები</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{ing.item}</span>
                        <span className="text-[var(--muted-foreground)] font-medium">{ing.amount}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">👨‍🍳 მომზადება</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="text-sm text-[var(--muted-foreground)] flex gap-2">
                        <span className="font-bold text-[var(--foreground)] flex-shrink-0">{i + 1}.</span>
                        <span>{step.replace(/^\d+\.\s*/, '')}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            {recipe.tips && (
              <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-4 text-sm">
                <span className="font-medium">💡 რჩევა: </span>
                <span className="text-[var(--muted-foreground)]">{recipe.tips}</span>
              </div>
            )}

            <Button onClick={() => { setRecipe(null); setIngredients('') }} className="w-full btn-secondary">
              ახალი რეცეპტი
            </Button>
          </div>
        )}

        {!recipe && !generating && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p className="text-5xl mb-4">👨‍🍳</p>
            <p className="text-sm">ჩამოწერე ინგრედიენტები — AI შეადგენს რეცეპტს კალორიებით</p>
          </div>
        )}
      </div>
    </div>
  )
}
