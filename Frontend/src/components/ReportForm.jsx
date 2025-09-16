import React, { useState } from 'react';
import { submitReport } from '../services/api';

function ReportForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await submitReport({ title, description });
      setMessage('Report submitted successfully!');
      setTitle('');
      setDescription('');
    } catch (err) {
      setMessage('Error submitting report.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: '8px' }}>
      <h3>Submit a Report</h3>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
        style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default ReportForm;
