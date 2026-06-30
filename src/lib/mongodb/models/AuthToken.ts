import mongoose, { Schema } from 'mongoose'

const AuthTokenSchema = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  type: { type: String, enum: ['password_reset', 'admin_otp'], required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true })

AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AuthToken = mongoose.models.AuthToken || mongoose.model('AuthToken', AuthTokenSchema)
