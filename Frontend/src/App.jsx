import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReportForm from "./components/ReportForm";
import Reports from "./pages/Reports";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<ReportForm />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
