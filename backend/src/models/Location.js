import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 120,
    },
  },
  { timestamps: true }
);

LocationSchema.index({ name: 1 });

export const Location = mongoose.model("Location", LocationSchema);

