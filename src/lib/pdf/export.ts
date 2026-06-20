'use client'

export async function exportProgressPDF(
  name: string,
  entries: { date: string; weight_kg?: number; waist_cm?: number; chest_cm?: number; biceps_cm?: number }[]
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Progress Report', 14, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`User: ${name}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 37)

  const headers = ['Date', 'Weight(kg)', 'Waist(cm)', 'Chest(cm)', 'Biceps(cm)']
  const colWidths = [35, 35, 35, 35, 35]
  let y = 50

  doc.setFont('helvetica', 'bold')
  doc.setFillColor(34, 197, 94)
  doc.rect(14, y - 5, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  let x = 14
  headers.forEach((h, i) => { doc.text(h, x + 2, y); x += colWidths[i] })
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  y += 10

  entries.slice(0, 30).forEach((e, idx) => {
    if (y > 270) { doc.addPage(); y = 20 }
    if (idx % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(14, y - 5, 182, 8, 'F')
    }
    const row = [
      new Date(e.date).toLocaleDateString('en-GB'),
      e.weight_kg ? String(e.weight_kg) : '—',
      e.waist_cm ? String(e.waist_cm) : '—',
      e.chest_cm ? String(e.chest_cm) : '—',
      e.biceps_cm ? String(e.biceps_cm) : '—',
    ]
    x = 14
    row.forEach((cell, i) => { doc.text(cell, x + 2, y); x += colWidths[i] })
    y += 10
  })

  doc.save(`progress-${name}-${new Date().toISOString().split('T')[0]}.pdf`)
}

export async function exportMealPlanPDF(
  name: string,
  days: {
    day: number
    day_name: string
    total_calories: number
    total_protein_g: number
    meals: {
      breakfast?: { name: string; calories: number }
      lunch?: { name: string; calories: number }
      dinner?: { name: string; calories: number }
      snack?: { name: string; calories: number }
    }
  }[]
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Meal Plan', 14, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`User: ${name}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 37)

  let y = 50
  days.forEach(day => {
    if (y > 250) { doc.addPage(); y = 20 }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setFillColor(34, 197, 94)
    doc.rect(14, y - 5, 182, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(`Day ${day.day}: ${day.day_name}  |  ${day.total_calories} kcal  |  Protein: ${day.total_protein_g}g`, 16, y)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y += 10

    const meals = [
      ['Breakfast', day.meals.breakfast],
      ['Lunch', day.meals.lunch],
      ['Dinner', day.meals.dinner],
      ['Snack', day.meals.snack],
    ] as [string, { name: string; calories: number } | undefined][]

    meals.forEach(([label, meal]) => {
      if (!meal) return
      doc.text(`  ${label}: ${meal.name} (${meal.calories} kcal)`, 16, y)
      y += 7
    })
    y += 5
  })

  doc.save(`meal-plan-${name}-${new Date().toISOString().split('T')[0]}.pdf`)
}
