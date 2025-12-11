import mongoose from "mongoose";

export async function connectToDatabase(uri) {
  if (!uri) {
    throw new Error("MONGO_URI is required to start the server");
  }

  mongoose.set("strictQuery", false);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}

