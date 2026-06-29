'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSwipe } from '@/hooks/useSwipe'
import { haptic } from '@/lib/haptic'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { MealPlan, DayPlan } from '@/types/nutrition'

export default function NutritionPage() {
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [planType, setPlanType] = useState<'7day' | '30day'>('7day')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'plan' | 'shopping'>('plan')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    setLoading(true)
    const res = await fetch('/api/ai/meal-plan')
    const data = await res.json()
    if (data.length > 0) setActivePlan(data[0])
    setLoading(false)
  }

  async function handleExportPDF() {
    if (!activePlan?.content?.days) return
    setExporting(true)
    const { exportMealPlanPDF } = await import('@/lib/pdf/export')
    await exportMealPlanPDF('Meal Plan', activePlan.content.days)
    setExporting(false)
  }

  async function generatePlan() {
    haptic('medium')
    setGenerating(true)
    const res = await fetch('/api/ai/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: planType }),
    })
    if (res.ok) {
      await loadPlans()
      haptic('success')
    }
    setGenerating(false)
  }

  const swipeHandlers = useSwipe(
    useCallback(() => {
      const maxDay = (activePlan?.content?.days?.length ?? 1) - 1
      if (activeDay < maxDay) { setActiveDay(d => d + 1); haptic('light') }
    }, [activePlan, activeDay]),
    useCallback(() => {
      if (activeDay > 0) { setActiveDay(d => d - 1); haptic('light') }
    }, [activeDay])
  )

  const days = activePlan?.content?.days || []
  const day: DayPlan | undefined = days[activeDay]

  return (
    <div className="animate-fade-in">
      <TopBar title="კვების გეგმა" subtitle="AI-ით შედგენილი პირადი რაციონი" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Plan selector / generator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">კვების გეგმის გენერაცია</h3>
                <p className="text-sm text-[var(--muted-foreground)]">AI შეადგენს პერსონალურ რაციონს ქართული სამზარეულოთი</p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                  <button
                    onClick={() => setPlanType('7day')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${planType === '7day' ? 'bg-primary-600 text-white' : 'hover:bg-[var(--muted)]'}`}
                  >7 დღე</button>
                  <button
                    onClick={() => setPlanType('30day')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${planType === '30day' ? 'bg-primary-600 text-white' : 'hover:bg-[var(--muted)]'}`}
                  >30 დღე</button>
                </div>
                <Button onClick={generatePlan} loading={generating}>
                  {generating ? 'მიმდინარეობს...' : '✨ AI გეგმა'}
                </Button>
                {activePlan && (
                  <Button onClick={handleExportPDF} loading={exporting} className="btn-secondary">
                    📄 PDF
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p>გეგმა იტვირთება...</p>
          </div>
        ) : !activePlan ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-5xl mb-4">🥗</p>
            <h3 className="text-lg font-medium mb-2">კვების გეგმა არ არის</h3>
            <p className="text-sm mb-6">დააჭირე &ldquo;AI გეგმა&rdquo; ღილაკს პირადი რაციონის შესაქმნელად</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--border)]">
              {(['plan', 'shopping'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-[var(--muted-foreground)]'
                  }`}
                >
                  {tab === 'plan' ? '📅 კვების გეგმა' : '🛒 სავაჭრო სია'}
                </button>
              ))}
            </div>

            {activeTab === 'plan' && (
              <>
                {/* Day selector */}
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2" {...swipeHandlers}>
                    {days.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => { setActiveDay(i); haptic('light') }}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeDay === i ? 'bg-primary-600 text-white' : 'bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)]'
                        }`}
                      >
                        <div className="text-xs opacity-70">დღე {d.day}</div>
                        <div>{d.day_name}</div>
                      </button>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
                </div>

                {day && (
                  <div className="space-y-4">
                    {/* Day summary */}
                    <div className="flex gap-3 flex-wrap">
                      <Badge variant="calories">🔥 {day.total_calories} კკალ</Badge>
                      <Badge variant="protein">🥩 ც: {day.total_protein_g}გ</Badge>
                      <Badge variant="fat">🧈 ც: {day.total_fat_g}გ</Badge>
                      <Badge variant="carbs">🍞 ნ: {day.total_carbs_g}გ</Badge>
                    </div>

                    {/* Meals */}
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealKey => {
                      const meal = day.meals[mealKey]
                      if (!meal) return null
                      const mealNames = { breakfast: '☀️ საუზმე', lunch: '🌞 სადილი', dinner: '🌙 ვახშამი', snack: '🍎 სნეკი' }
                      return (
                        <Card key={mealKey}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{mealNames[mealKey]}: {meal.name}</CardTitle>
                              <Badge variant="calories">{meal.calories} კკალ</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2 mb-3 flex-wrap">
                              <Badge variant="protein">ც: {meal.protein_g}გ</Badge>
                              <Badge variant="fat">ც: {meal.fat_g}გ</Badge>
                              <Badge variant="carbs">ნ: {meal.carbs_g}გ</Badge>
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)] mb-2">
                              <span className="font-medium text-[var(--foreground)]">ინგრედიენტები: </span>
                              {meal.ingredients?.join(', ')}
                            </div>
                            {meal.recipe && (
                              <div className="text-sm bg-[var(--muted)] rounded-lg p-3 mt-2">
                                <p className="font-medium mb-1">📝 მომზადება:</p>
                                <p className="text-[var(--muted-foreground)]">{meal.recipe}</p>
                              </div>
                            )}
                            {meal.alternatives && meal.alternatives.length > 0 && (
                              <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                                💡 ალტერნატივა: {meal.alternatives.join(', ')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'shopping' && activePlan.content.shopping_list && (
              <ShoppingListView items={activePlan.content.shopping_list} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ShoppingListView({ items }: { items: { category: string; item: string; amount: string; estimated_price?: number }[] }) {
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const totalPrice = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0)

  return (
    <div className="space-y-4">
      {totalPrice > 0 && (
        <div className="flex justify-between items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <span className="font-medium">სავარაუდო ბიუჯეტი</span>
          <Badge variant="success">≈ {totalPrice.toFixed(0)} ₾</Badge>
        </div>
      )}
      {Object.entries(grouped).map(([category, catItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">📦 {category}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {catItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span>{item.item}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted-foreground)]">{item.amount}</span>
                    {item.estimated_price && (
                      <Badge variant="default">≈ {item.estimated_price} ₾</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
