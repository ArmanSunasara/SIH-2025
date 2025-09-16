import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: String,
  patientAge: Number,
  patientGender: String,
  symptoms: [String],
  location: {
    lat: Number,
    lng: Number,
    village: String
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Report", reportSchema);
