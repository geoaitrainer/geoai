import mongoose, { Schema } from "mongoose"

const MealPlanSchema = new Schema(
  {
    userId: { type: String, required: true },
    type: String,
    content: Schema.Types.Mixed,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

MealPlanSchema.index({ userId: 1, is_active: 1 })

export const MealPlan = mongoose.models.MealPlan || mongoose.model("MealPlan", MealPlanSchema)
