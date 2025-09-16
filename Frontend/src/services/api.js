import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Reports
export const createReport = (reportData) => API.post("/reports", reportData);
export const getReports = () => API.get("/reports");

// ML Prediction
export const getMLPrediction = (features) =>
	API.post("/ml/predict", { features });
