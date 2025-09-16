import axios from "axios";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5001/predict";

export const getPredictionFromML = async (features) => {
  try {
    const response = await axios.post(ML_API_URL, { features });
    return response.data; // { probability: 0.75 }
  } catch (error) {
    console.error("❌ ML Service error:", error.message);
    throw new Error("Failed to connect to ML Service");
  }
};
