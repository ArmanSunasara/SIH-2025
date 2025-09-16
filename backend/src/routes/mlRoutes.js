import express from "express";
import { predictOutbreak } from "../controllers/mlController.js";

const router = express.Router();

router.post("/predict", predictOutbreak);

export default router;
