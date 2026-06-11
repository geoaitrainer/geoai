import mongoose from "mongoose"
import dns from "dns"
import dnsPromises from "dns/promises"

dns.setServers(["8.8.8.8", "8.8.4.4"])
dnsPromises.setServers(["8.8.8.8", "8.8.4.4"])

const MONGODB_URI = process.env.MONGODB_URI!

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

let cached = global._mongoose
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached!.conn) return cached!.conn
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      dbName: "trainer-db",
      bufferCommands: false,
    })
  }
  cached!.conn = await cached!.promise
  return cached!.conn
}
