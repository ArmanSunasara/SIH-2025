import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav>
      <Link to="/">Submit Report</Link> |{" "}
      <Link to="/reports">Reports</Link> |{" "}
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  );
}
