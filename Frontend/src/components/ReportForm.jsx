import { useState } from "react";
import { createReport, getMLPrediction } from "../services/api";

export default function ReportForm() {
  const [form, setForm] = useState({
    reporterId: "",
    patientAge: "",
    patientGender: "",
    symptoms: "",
    village: "",
    lat: "",
    lng: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const features = {
        patientAge: Number(form.patientAge),
        patientGender: form.patientGender,
        symptoms: form.symptoms.split(",").map((s) => s.trim()),
        location: {
          lat: Number(form.lat),
          lng: Number(form.lng),
          village: form.village
        }
      };
      // Get ML prediction from backend
      const mlRes = await getMLPrediction(features);
      if (mlRes?.data?.probability !== undefined) {
        alert(`ML Prediction Probability: ${mlRes.data.probability}`);
      }
      // Optionally, submit report after prediction
      const payload = {
        reporterId: form.reporterId,
        ...features
      };
      await createReport(payload);
      alert("✅ Report submitted successfully!");
      setForm({
        reporterId: "",
        patientAge: "",
        patientGender: "",
        symptoms: "",
        village: "",
        lat: "",
        lng: ""
      });
    } catch (error) {
      console.error(error);
      alert("❌ Failed to submit report");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Submit Health Report</h2>

      <input
        name="reporterId"
        value={form.reporterId}
        onChange={handleChange}
        placeholder="Reporter ID"
        required
      />

      <input
        name="patientAge"
        value={form.patientAge}
        onChange={handleChange}
        placeholder="Patient Age"
        required
      />

      <input
        name="patientGender"
        value={form.patientGender}
        onChange={handleChange}
        placeholder="Patient Gender"
        required
      />

      <input
        name="symptoms"
        value={form.symptoms}
        onChange={handleChange}
        placeholder="Symptoms (comma separated)"
        required
      />

      <input
        name="village"
        value={form.village}
        onChange={handleChange}
        placeholder="Village Name"
        required
      />

      <input
        name="lat"
        value={form.lat}
        onChange={handleChange}
        placeholder="Latitude"
        required
      />

      <input
        name="lng"
        value={form.lng}
        onChange={handleChange}
        placeholder="Longitude"
        required
      />

      <button type="submit">Submit</button>
    </form>
  );
}
