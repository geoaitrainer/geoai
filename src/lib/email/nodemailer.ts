import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await getTransporter().sendMail({
    from: `"AI ტრენერი" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'პაროლის აღდგენა — AI ტრენერი',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#16a34a;margin-bottom:8px">AI ტრენერი</h2>
        <p style="color:#374151;margin-bottom:24px">პაროლის აღდგენის მოთხოვნა მიღებულია.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
          პაროლის შეცვლა
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          ლინკი მოქმედებს 1 საათი.<br>
          თუ ეს მოთხოვნა თქვენი არ არის — უგულებელყავით ეს ელფოსტა.
        </p>
      </div>
    `,
  })
}

export async function sendDailyPlanEmail(
  email: string,
  name: string,
  mealDay: DailyMeals | null,
  workoutDay: WorkoutDayResult | null,
  profile: ProfileSnippet | null,
) {
  const today = new Date().toLocaleDateString('ka-GE', { weekday: 'long', day: 'numeric', month: 'long' })

  const mealHtml = mealDay ? `
    <h2 style="color:#16a34a;margin:24px 0 12px">🥗 დღის კვება — ${mealDay.day_name ?? ''}</h2>
    ${(['breakfast','lunch','dinner','snack'] as const).map(key => {
      const m = mealDay.meals?.[key]
      if (!m) return ''
      const labels: Record<string,string> = { breakfast:'☀️ საუზმე', lunch:'🍽 სადილი', dinner:'🌙 ვახშამი', snack:'🍎 სნეკი' }
      return `
        <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:12px 16px;margin-bottom:10px">
          <p style="margin:0 0 4px;font-weight:600;color:#15803d">${labels[key]}: ${m.name}</p>
          <p style="margin:0;color:#6b7280;font-size:13px">${m.calories} კკალ &nbsp;·&nbsp; ცილა: ${m.protein_g}გ &nbsp;·&nbsp; ცხიმი: ${m.fat_g}გ &nbsp;·&nbsp; ნახ: ${m.carbs_g}გ</p>
          ${m.recipe ? `<p style="margin:6px 0 0;font-size:12px;color:#374151">${m.recipe}</p>` : ''}
        </div>`
    }).join('')}
    <div style="background:#dcfce7;border-radius:8px;padding:10px 16px;margin-top:8px">
      <p style="margin:0;font-size:13px;color:#15803d">
        სულ: <strong>${mealDay.total_calories ?? 0} კკალ</strong> &nbsp;|&nbsp;
        ცილა: <strong>${mealDay.total_protein_g ?? 0}გ</strong> &nbsp;|&nbsp;
        ცხიმი: <strong>${mealDay.total_fat_g ?? 0}გ</strong> &nbsp;|&nbsp;
        ნახ: <strong>${mealDay.total_carbs_g ?? 0}გ</strong>
      </p>
    </div>` : '<p style="color:#6b7280">კვების გეგმა არ არის.</p>'

  const workoutHtml = !workoutDay ? '' : workoutDay.isRest
    ? `<h2 style="color:#16a34a;margin:24px 0 12px">💤 დღის ვარჯიში</h2>
       <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:12px 16px">
         <p style="margin:0;color:#374151">დასვენების დღეა — აქტიური გამოჯანმრთელება (სიარული, გაჭიმვა).</p>
       </div>`
    : `<h2 style="color:#16a34a;margin:24px 0 12px">💪 დღის ვარჯიში — ${workoutDay.day?.day_name ?? ''}</h2>
       ${workoutDay.day?.warmup ? `<p style="color:#6b7280;font-size:13px;margin-bottom:10px">🔥 გათბობა: ${workoutDay.day.warmup}</p>` : ''}
       ${(workoutDay.day?.exercises ?? []).map(ex => `
         <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:10px 14px;margin-bottom:8px">
           <p style="margin:0 0 2px;font-weight:600;color:#15803d">${ex.name}</p>
           <p style="margin:0;color:#6b7280;font-size:13px">${ex.sets} სეტი × ${ex.reps} გამეორება${ex.rest_seconds ? ` · დასვენება: ${ex.rest_seconds}წმ` : ''}${ex.weight_suggestion ? ` · ${ex.weight_suggestion}` : ''}</p>
           ${ex.notes ? `<p style="margin:4px 0 0;font-size:12px;color:#374151">${ex.notes}</p>` : ''}
         </div>`).join('')}
       ${workoutDay.day?.cooldown ? `<p style="color:#6b7280;font-size:13px;margin-top:8px">❄️ გაგრილება: ${workoutDay.day.cooldown}</p>` : ''}
       ${workoutDay.day?.duration_minutes ? `<p style="color:#6b7280;font-size:13px">⏱ სავარაუდო დრო: ${workoutDay.day.duration_minutes} წუთი</p>` : ''}`

  await getTransporter().sendMail({
    from: `"AI ტრენერი" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `${today} — შენი დღის გეგმა 💪`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#16a34a;margin:0;font-size:22px">AI ტრენერი</h1>
          <p style="color:#6b7280;margin:4px 0 0;font-size:14px">${today}</p>
        </div>
        <p style="color:#374151">გამარჯობა, <strong>${name}</strong>! 👋</p>
        <p style="color:#6b7280;font-size:14px;margin-top:-8px">
          ${profile?.calorie_goal ? `დღიური მიზანი: <strong>${profile.calorie_goal} კკალ</strong>` : ''}
        </p>
        ${mealHtml}
        ${workoutHtml}
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center">
          <a href="${process.env.NEXTAUTH_URL ?? 'https://geotraener.vercel.app'}/dashboard"
             style="display:inline-block;background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            დეშბორდზე გადასვლა →
          </a>
          <p style="color:#9ca3af;font-size:11px;margin-top:16px">AI ტრენერი · geotraener.vercel.app</p>
        </div>
      </div>`,
  })
}

// ── Types for daily email ──────────────────────────────────────────────────────

interface DailyMeals {
  day_name?: string
  meals?: {
    breakfast?: MealItem
    lunch?: MealItem
    dinner?: MealItem
    snack?: MealItem
  }
  total_calories?: number
  total_protein_g?: number
  total_fat_g?: number
  total_carbs_g?: number
}

interface MealItem {
  name: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  recipe?: string
}

interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
  weight_suggestion?: string
}

interface WorkoutDayData {
  day_name?: string
  warmup?: string
  cooldown?: string
  duration_minutes?: number
  exercises?: WorkoutExercise[]
}

interface WorkoutDayResult {
  isRest: boolean
  day?: WorkoutDayData | null
}

interface ProfileSnippet {
  calorie_goal?: number
}

export async function sendAdminOtpEmail(email: string, otp: string) {
  await getTransporter().sendMail({
    from: `"AI ტრენერი" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `ადმინ კოდი: ${otp} — AI ტრენერი`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#16a34a;margin-bottom:8px">ადმინ შესვლის კოდი</h2>
        <p style="color:#374151;margin-bottom:16px">ადმინ პანელში შესვლის ერთჯერადი კოდი:</p>
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#15803d">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">კოდი მოქმედებს 10 წუთი. თუ ეს მოთხოვნა თქვენი არ არის — შეატყობინეთ.</p>
      </div>
    `,
  })
}
