import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mlAPI_service, predictionsAPI } from '../services/api';
import './Predict.css';

const Predict = () => {
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
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

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

      // Save prediction to backend
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

  return (
    <div className="predict-container">
      <div className="predict-card">
        <h2>Water Quality Prediction</h2>
        <p className="predict-description">
          Enter the water parameters below to predict if the water is safe for consumption.
        </p>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className={`result-card ${result.prediction === 1 ? 'safe' : 'unsafe'}`}>
            <h3>Prediction Result</h3>
            <div className="result-content">
              <div className="result-main">
                <span className="result-icon">
                  {result.prediction === 1 ? '✅' : '❌'}
                </span>
                <span className="result-text">{result.result}</span>
              </div>
              <div className="result-details">
                <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                <p>Probability: {(result.probability * 100).toFixed(1)}%</p>
              </div>
            </div>
            <button onClick={resetForm} className="new-prediction-btn">
              Make New Prediction
            </button>
          </div>
        )}

        {!result && (
          <form onSubmit={handleSubmit} className="predict-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="pH">pH</label>
                <input
                  type="number"
                  step="0.01"
                  id="pH"
                  name="pH"
                  value={formData.pH}
                  onChange={handleChange}
                  required
                  placeholder="6.5 - 8.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hardness">Hardness</label>
                <input
                  type="number"
                  step="0.01"
                  id="hardness"
                  name="hardness"
                  value={formData.hardness}
                  onChange={handleChange}
                  required
                  placeholder="mg/L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="solids">Total Dissolved Solids</label>
                <input
                  type="number"
                  step="0.01"
                  id="solids"
                  name="solids"
                  value={formData.solids}
                  onChange={handleChange}
                  required
                  placeholder="ppm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="chloramines">Chloramines</label>
                <input
                  type="number"
                  step="0.01"
                  id="chloramines"
                  name="chloramines"
                  value={formData.chloramines}
                  onChange={handleChange}
                  required
                  placeholder="ppm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sulfate">Sulfate</label>
                <input
                  type="number"
                  step="0.01"
                  id="sulfate"
                  name="sulfate"
                  value={formData.sulfate}
                  onChange={handleChange}
                  required
                  placeholder="mg/L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="conductivity">Conductivity</label>
                <input
                  type="number"
                  step="0.01"
                  id="conductivity"
                  name="conductivity"
                  value={formData.conductivity}
                  onChange={handleChange}
                  required
                  placeholder="μS/cm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="organicCarbon">Organic Carbon</label>
                <input
                  type="number"
                  step="0.01"
                  id="organicCarbon"
                  name="organicCarbon"
                  value={formData.organicCarbon}
                  onChange={handleChange}
                  required
                  placeholder="ppm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="trihalomethanes">Trihalomethanes</label>
                <input
                  type="number"
                  step="0.01"
                  id="trihalomethanes"
                  name="trihalomethanes"
                  value={formData.trihalomethanes}
                  onChange={handleChange}
                  required
                  placeholder="μg/L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="turbidity">Turbidity</label>
                <input
                  type="number"
                  step="0.01"
                  id="turbidity"
                  name="turbidity"
                  value={formData.turbidity}
                  onChange={handleChange}
                  required
                  placeholder="NTU"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="predict-button">
              {loading ? 'Predicting...' : 'Predict Water Quality'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Predict;