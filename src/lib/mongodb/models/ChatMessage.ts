import mongoose, { Schema } from "mongoose"

const ChatMessageSchema = new Schema(
  {
    userId: { type: String, required: true },
    role: String,
    content: String,
  },
  { timestamps: true }
)

ChatMessageSchema.index({ userId: 1, createdAt: -1 })

export const ChatMessage =
  mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema)
