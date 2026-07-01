import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb/mongoose"
import { User } from "@/lib/mongodb/models/User"
import { Profile } from "@/lib/mongodb/models/Profile"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  const {
    email, password, name, age, gender, height_cm, weight_kg,
    goal, activity_level, work_type, experience,
    allergies, conditions, liked_foods, disliked_foods, daily_budget,
  } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name აუცილებელია" }, { status: 400 })
  }

  await connectDB()

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    return NextResponse.json({ error: "ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await User.create({ email: normalizedEmail, name, hashedPassword })
  const userId = user._id.toString()

  await Profile.create({
    userId,
    name,
    age: age ? parseInt(age) : 25,
    gender: gender || "male",
    height_cm: height_cm ? parseFloat(height_cm) : undefined,
    weight_kg: weight_kg ? parseFloat(weight_kg) : undefined,
    goal: goal || "maintain",
    activity_level: activity_level || "moderate",
    work_type: work_type || "desk",
    experience: experience || "beginner",
    allergies: allergies || [],
    conditions: conditions || [],
    liked_foods: liked_foods || [],
    disliked_foods: disliked_foods || [],
    daily_budget: daily_budget ? parseFloat(daily_budget) : 50,
  })

  return NextResponse.json({ success: true })
}
