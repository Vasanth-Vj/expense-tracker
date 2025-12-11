import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 160,
    },
  },
  { timestamps: true }
);

ClientSchema.index({ name: 1 });

export const Client = mongoose.model("Client", ClientSchema);

