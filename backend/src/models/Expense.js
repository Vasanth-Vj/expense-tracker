import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    fromLocation: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    toLocation: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    kilometers: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
    rupees: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000,
      default: 3,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      max: 100000000,
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: 1 });
ExpenseSchema.index({ clientName: 1 });

ExpenseSchema.pre("validate", function preValidate(next) {
  if (this.kilometers != null) {
    const rupeesValue = this.rupees ?? 3;
    this.rupees = rupeesValue;
    this.total = Number((this.kilometers * rupeesValue).toFixed(2));
  }
  next();
});

export const Expense = mongoose.model("Expense", ExpenseSchema);

