import { Router } from "express";
import { listOptions } from "../controllers/optionController.js";

const router = Router();

router.get("/", listOptions);

export default router;

