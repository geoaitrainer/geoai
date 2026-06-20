import mongoose, { Schema } from 'mongoose'

const WaterEntrySchema = new Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  amount_ml: { type: Number, required: true },
}, { timestamps: true })

WaterEntrySchema.index({ userId: 1, date: 1 })

export const WaterEntry = mongoose.models.WaterEntry || mongoose.model('WaterEntry', WaterEntrySchema)
