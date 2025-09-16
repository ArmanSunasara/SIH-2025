import { getPredictionFromML } from "../services/mlService.js";
import Report from "../models/Report.js";

export const predictOutbreak = async (req, res) => {
  try {
    const features = req.body.features;

    if (!features) {
      return res.status(400).json({ error: "Features are required" });
    }

    // Call ML microservice
    const prediction = await getPredictionFromML(features);

    // Save report + prediction in MongoDB
    const newReport = new Report({
      features,
      probability: prediction.probability,
      createdAt: new Date(),
    });

    await newReport.save();

    res.json({
      success: true,
      data: prediction,
    });
  } catch (err) {
    console.error("Prediction error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
