import mongoose, { Schema } from "mongoose"

const ProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, default: 25 },
    gender: { type: String, default: "male" },
    height_cm: Number,
    weight_kg: Number,
    goal: { type: String, default: "maintain" },
    activity_level: { type: String, default: "moderate" },
    work_type: { type: String, default: "desk" },
    experience: { type: String, default: "beginner" },
    allergies: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    liked_foods: { type: [String], default: [] },
    disliked_foods: { type: [String], default: [] },
    daily_budget: { type: Number, default: 50 },
    bmr: Number,
    tdee: Number,
    calorie_goal: Number,
    protein_g: Number,
    fat_g: Number,
    carbs_g: Number,
    is_admin: { type: Boolean, default: false },
    plan: { type: String, default: "free" },
  },
  { timestamps: true }
)

export const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema)
