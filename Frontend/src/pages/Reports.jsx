import { useEffect, useState } from "react";
import { getReports } from "../services/api";

export default function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function fetchReports() {
      const { data } = await getReports();
      setReports(data);
    }
    fetchReports();
  }, []);

  return (
    <div>
      <h1>Submitted Reports</h1>
      <ul>
        {reports.map((r) => (
          <li key={r._id}>
            {r.reporterId} → {r.symptoms.join(", ")} in {r.location.village}
          </li>
        ))}
      </ul>
    </div>
  );
}
