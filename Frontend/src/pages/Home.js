import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mlAPI_service, predictionsAPI } from '../services/api';
import './Home.css';

const Home = () => {
  const [formData, setFormData] = useState({
    pH: '',
    hardness: '',
    solids: '',
    chloramines: '',
    sulfate: '',
    conductivity: '',
    organicCarbon: '',
    trihalomethanes: '',
    turbidity: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Prepare features array in the correct order
      const features = [
        parseFloat(formData.pH),
        parseFloat(formData.hardness),
        parseFloat(formData.solids),
        parseFloat(formData.chloramines),
        parseFloat(formData.sulfate),
        parseFloat(formData.conductivity),
        parseFloat(formData.organicCarbon),
        parseFloat(formData.trihalomethanes),
        parseFloat(formData.turbidity)
      ];

      // Validate all fields are numbers
      if (features.some(isNaN)) {
        setError('Please fill in all fields with valid numbers');
        setLoading(false);
        return;
      }

      // Call ML service
      const mlResponse = await mlAPI_service.predict(features);
      const predictionResult = mlResponse.data;

      setResult(predictionResult);

      // Save prediction to backend if user is authenticated
      if (isAuthenticated) {
        try {
          await predictionsAPI.save({
            input: formData,
            prediction: predictionResult.prediction,
            probability: predictionResult.probability,
            result: predictionResult.result,
            confidence: predictionResult.confidence
          });
        } catch (saveError) {
          console.warn('Failed to save prediction:', saveError);
          // Don't show this error to user as prediction was successful
        }
      }

    } catch (error) {
      setError(error.response?.data?.detail || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pH: '',
      hardness: '',
      solids: '',
      chloramines: '',
      sulfate: '',
      conductivity: '',
      organicCarbon: '',
      trihalomethanes: '',
      turbidity: ''
    });
    setResult(null);
    setError('');
  };

  const fillSampleData = () => {
    setFormData({
      pH: '7.2',
      hardness: '180.0',
      solids: '20000',
      chloramines: '7.0',
      sulfate: '300.0',
      conductivity: '400.0',
      organicCarbon: '14.0',
      trihalomethanes: '70.0',
      turbidity: '3.5'
    });
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>🌊 Water Quality Checker</h1>
        <p className="hero-description">
          Enter your water quality parameters below to instantly check if your water is safe for consumption.
          Our advanced ML model analyzes 9 key parameters to give you accurate predictions.
        </p>
        {!isAuthenticated && (
          <div className="auth-notice">
            <p>💡 <a href="/register">Register</a> or <a href="/login">Login</a> to save your prediction history!</p>
          </div>
        )}
      </div>

      <div className="prediction-section">
        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className={`result-card ${result.prediction === 1 ? 'safe' : 'unsafe'}`}>
            <h3>🔬 Prediction Result</h3>
            <div className="result-content">
              <div className="result-main">
                <span className="result-icon">
                  {result.prediction === 1 ? '✅' : '❌'}
                </span>
                <div className="result-info">
                  <span className="result-text">{result.result}</span>
                  <div className="result-details">
                    <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                    <span>Probability: {(result.probability * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="result-actions">
                <button onClick={resetForm} className="new-prediction-btn">
                  🔄 Check Another Sample
                </button>
                {isAuthenticated && (
                  <a href="/history" className="history-link">
                    📊 View History
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {!result && (
          <div className="prediction-form-container">
            <div className="form-header">
              <h2>Water Quality Parameters</h2>
              <button onClick={fillSampleData} className="sample-btn" type="button">
                📝 Fill Sample Data
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="prediction-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="pH">
                    pH Level
                    <span className="hint">(6.5-8.5 ideal)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="pH"
                    name="pH"
                    value={formData.pH}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 7.2"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hardness">
                    Hardness
                    <span className="hint">(mg/L)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="hardness"
                    name="hardness"
                    value={formData.hardness}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 180"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="solids">
                    Total Dissolved Solids
                    <span className="hint">(ppm)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="solids"
                    name="solids"
                    value={formData.solids}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 20000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="chloramines">
                    Chloramines
                    <span className="hint">(ppm)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="chloramines"
                    name="chloramines"
                    value={formData.chloramines}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 7.0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sulfate">
                    Sulfate
                    <span className="hint">(mg/L)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="sulfate"
                    name="sulfate"
                    value={formData.sulfate}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 300"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="conductivity">
                    Conductivity
                    <span className="hint">(μS/cm)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="conductivity"
                    name="conductivity"
                    value={formData.conductivity}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 400"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="organicCarbon">
                    Organic Carbon
                    <span className="hint">(ppm)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="organicCarbon"
                    name="organicCarbon"
                    value={formData.organicCarbon}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 14.0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="trihalomethanes">
                    Trihalomethanes
                    <span className="hint">(μg/L)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="trihalomethanes"
                    name="trihalomethanes"
                    value={formData.trihalomethanes}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 70.0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="turbidity">
                    Turbidity
                    <span className="hint">(NTU)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="turbidity"
                    name="turbidity"
                    value={formData.turbidity}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="predict-button">
                  {loading ? '🔄 Analyzing...' : '🧪 Check Water Quality'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="info-section">
          <h3>ℹ️ About Water Quality Parameters</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>pH:</strong> Measures acidity/alkalinity (6.5-8.5 is safe)
            </div>
            <div className="info-item">
              <strong>Hardness:</strong> Mineral content, mainly calcium and magnesium
            </div>
            <div className="info-item">
              <strong>Solids:</strong> Total dissolved substances in water
            </div>
            <div className="info-item">
              <strong>Chloramines:</strong> Disinfectant used in water treatment
            </div>
            <div className="info-item">
              <strong>Sulfate:</strong> Naturally occurring mineral in water
            </div>
            <div className="info-item">
              <strong>Conductivity:</strong> Water's ability to conduct electricity
            </div>
            <div className="info-item">
              <strong>Organic Carbon:</strong> Measure of organic compounds
            </div>
            <div className="info-item">
              <strong>Trihalomethanes:</strong> Chemical byproducts of chlorination
            </div>
            <div className="info-item">
              <strong>Turbidity:</strong> Measure of water clarity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;