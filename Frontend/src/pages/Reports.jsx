import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports().then(data => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Reports</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {reports.map((report, idx) => (
            <li key={idx}>
              <strong>{report.title}</strong>: {report.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Reports;
