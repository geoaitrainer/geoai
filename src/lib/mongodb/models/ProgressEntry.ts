import mongoose, { Schema } from "mongoose"

const ProgressEntrySchema = new Schema(
  {
    userId: { type: String, required: true },
    date: String,
    weight_kg: Number,
    body_fat_pct: Number,
    chest_cm: Number,
    waist_cm: Number,
    hips_cm: Number,
    biceps_cm: Number,
    notes: String,
    photo_url: String,
    ai_review: String,
  },
  { timestamps: true }
)

ProgressEntrySchema.index({ userId: 1, date: -1 })

export const ProgressEntry =
  mongoose.models.ProgressEntry || mongoose.model("ProgressEntry", ProgressEntrySchema)
