import express from "express";
import { createReport, getReports } from "../controllers/reportController.js";

const router = express.Router();

router.post("/", createReport);   // Submit report
router.get("/", getReports);      // Fetch all reports

export default router;
