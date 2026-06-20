import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    image: String,
    hashedPassword: String,
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model("User", UserSchema)
