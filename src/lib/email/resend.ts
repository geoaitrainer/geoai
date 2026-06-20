import { Resend } from 'resend'

let resend: Resend | null = null

export function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export function buildWeeklyReportHtml(data: {
  name: string
  goal: string
  weightChange: number | null
  currentWeight: number | null
  calorieAvg: number
  calorieGoal: number
  workoutsCompleted: number
  waterAvgMl: number
}): string {
  const weightSection = data.currentWeight
    ? `<p>⚖️ <strong>წონა:</strong> ${data.currentWeight}კგ ${data.weightChange !== null ? `(${data.weightChange > 0 ? '+' : ''}${data.weightChange.toFixed(1)}კგ კვირაში)` : ''}</p>`
    : ''

  return `
<!DOCTYPE html>
<html lang="ka">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .container { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  h1 { color: #16a34a; font-size: 22px; margin: 0 0 8px; }
  .subtitle { color: #64748b; font-size: 14px; margin: 0 0 24px; }
  .stat { background: #f0fdf4; border-radius: 10px; padding: 12px 16px; margin: 8px 0; font-size: 15px; }
  .footer { margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center; }
  a { color: #16a34a; }
</style></head>
<body>
<div class="container">
  <h1>🏋️ კვირის ანგარიში</h1>
  <p class="subtitle">გამარჯობა, <strong>${data.name}</strong>! ეს შენი კვირის შედეგებია.</p>

  <div class="stat">🎯 <strong>მიზანი:</strong> ${data.goal}</div>
  ${weightSection ? `<div class="stat">${weightSection}</div>` : ''}
  <div class="stat">🔥 <strong>საშ. კალორია:</strong> ${Math.round(data.calorieAvg)} / ${data.calorieGoal} კკალ</div>
  <div class="stat">💪 <strong>ვარჯიში კვირაში:</strong> ${data.workoutsCompleted} ვარჯიში</div>
  <div class="stat">💧 <strong>საშ. წყალი:</strong> ${Math.round(data.waterAvgMl)}მლ/დღე</div>

  <p style="margin-top:24px; font-size:14px; color:#374151;">
    გააგრძელე ასე! შენს <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard">dashboard-ზე</a> ნახავ სრულ პროგრესს.
  </p>

  <div class="footer">AI ტრენერი · <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}">aitrainer.ge</a></div>
</div>
</body>
</html>`
}
