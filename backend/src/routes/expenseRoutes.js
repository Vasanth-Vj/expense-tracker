import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  exportExpenses,
  listExpenses,
  updateExpense,
} from "../controllers/expenseController.js";

const router = Router();

router.post("/", createExpense);
router.get("/", listExpenses);
router.get("/export", exportExpenses);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;

