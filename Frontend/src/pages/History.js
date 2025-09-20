import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { predictionsAPI } from '../services/api';
import './History.css';

const History = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await predictionsAPI.getHistory(page, 10);
      setPredictions(response.data.predictions);
      setPagination(response.data.pagination);
    } catch (error) {
      setError('Failed to fetch prediction history');
      console.error('History fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextPage = () => {
    if (page < pagination.pages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading">Loading prediction history...</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Prediction History</h2>
        <p>Your water quality prediction results</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {predictions.length === 0 ? (
        <div className="no-data">
          <p>No predictions found. <a href="/predict">Make your first prediction!</a></p>
        </div>
      ) : (
        <>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Result</th>
                  <th>Confidence</th>
                  <th>pH</th>
                  <th>Hardness</th>
                  <th>Solids</th>
                  <th>Chloramines</th>
                  <th>Sulfate</th>
                  <th>Conductivity</th>
                  <th>Organic Carbon</th>
                  <th>Trihalomethanes</th>
                  <th>Turbidity</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction._id}>
                    <td>{formatDate(prediction.createdAt)}</td>
                    <td>
                      <span className={`result-badge ${prediction.prediction === 1 ? 'safe' : 'unsafe'}`}>
                        {prediction.result}
                      </span>
                    </td>
                    <td>{(prediction.confidence * 100).toFixed(1)}%</td>
                    <td>{prediction.input.pH}</td>
                    <td>{prediction.input.hardness}</td>
                    <td>{prediction.input.solids}</td>
                    <td>{prediction.input.chloramines}</td>
                    <td>{prediction.input.sulfate}</td>
                    <td>{prediction.input.conductivity}</td>
                    <td>{prediction.input.organicCarbon}</td>
                    <td>{prediction.input.trihalomethanes}</td>
                    <td>{prediction.input.turbidity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={prevPage} 
                disabled={page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {page} of {pagination.pages} ({pagination.total} total)
              </span>
              
              <button 
                onClick={nextPage} 
                disabled={page === pagination.pages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;