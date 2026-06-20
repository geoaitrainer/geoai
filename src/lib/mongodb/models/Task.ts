import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['nutrition', 'shopping', 'workout'], required: true },
  title: { type: String, required: true },
  date: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

TaskSchema.index({ userId: 1, type: 1, date: 1 })

export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)
