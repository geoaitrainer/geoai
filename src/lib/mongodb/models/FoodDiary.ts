import mongoose, { Schema } from "mongoose"

const FoodDiarySchema = new Schema(
  {
    userId: { type: String, required: true },
    date: String,
    meal_type: String,
    food_name: String,
    calories: Number,
    protein_g: Number,
    fat_g: Number,
    carbs_g: Number,
    weight_g: Number,
    notes: String,
    photo_url: String,
    ai_assessment: String,
  },
  { timestamps: true }
)

FoodDiarySchema.index({ userId: 1, date: 1 })

export const FoodDiary = mongoose.models.FoodDiary || mongoose.model("FoodDiary", FoodDiarySchema)
