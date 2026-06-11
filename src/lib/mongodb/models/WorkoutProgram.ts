import mongoose, { Schema } from "mongoose"

const WorkoutProgramSchema = new Schema(
  {
    userId: { type: String, required: true },
    type: String,
    level: String,
    content: Schema.Types.Mixed,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

WorkoutProgramSchema.index({ userId: 1, is_active: 1 })

export const WorkoutProgram =
  mongoose.models.WorkoutProgram || mongoose.model("WorkoutProgram", WorkoutProgramSchema)
