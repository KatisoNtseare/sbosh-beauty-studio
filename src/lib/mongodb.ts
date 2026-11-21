import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = globalThis as typeof globalThis & { mongooseCache?: Cached };
const cache = globalWithMongoose.mongooseCache ??= { conn: null, promise: null };

export async function connectDb() {
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
  try { cache.conn = await cache.promise; }
  catch (error) { cache.promise = null; throw error; }
  return cache.conn;
}
