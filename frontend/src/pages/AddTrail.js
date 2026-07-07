import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AddTrail() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', location: '', type: 'waterfall',
    difficulty: 'moderate', description: '', story: '', challenges: ''
  });
  const [waypoints, setWaypoints] = useState([
    { order: 1, title: '', description: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleWaypointChange = (index, field, value) => {
    const updated = [...waypoints];
    updated[index][field] = value;
    setWaypoints(updated);
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints,
      { order: waypoints.length + 1, title: '', description: '' }
    ]);
  };

  const removeWaypoint = (index) => {
    if (waypoints.length === 1) return;
    const updated = waypoints.filter((_, i) => i !== index)
      .map((wp, i) => ({ ...wp, order: i + 1 }));
    setWaypoints(updated);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.location) {
      setError('Name and location are required.'); return;
    }
    if (waypoints.some(wp => !wp.title || !wp.description)) {
      setError('Please fill in all waypoint fields.'); return;
    }
    setSubmitting(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/trails', { ...form, waypoints });
      navigate('/');
    } catch (err) {
      setError('Failed to submit. Try again.'); setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>🗺 Share a hidden spot</h2>
        <p style={styles.sub}>Your path helps the next visitor reach it safely</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.card}>
          <div style={styles.cardTitle}>Basic info</div>
          <label style={styles.label}>Spot name</label>
          <input style={styles.input} name="name" placeholder="e.g. Secret waterfall above Dhanaulti"
            value={form.name} onChange={handleChange} />

          <label style={styles.label}>Nearest village / landmark</label>
          <input style={styles.input} name="location" placeholder="e.g. Dhanaulti, Tehri Garhwal"
            value={form.location} onChange={handleChange} />

          <label style={styles.label}>Type of place</label>
          <select style={styles.input} name="type" value={form.type} onChange={handleChange}>
            <option value="waterfall">Waterfall</option>
            <option value="lake">Lake</option>
            <option value="cave">Cave</option>
            <option value="meadow">Meadow</option>
            <option value="river">River pool</option>
            <option value="summit">Summit</option>
            <option value="other">Other</option>
          </select>

          <label style={styles.label}>Difficulty</label>
          <div style={styles.diffRow}>
            {['easy','moderate','hard'].map(d => (
              <button key={d} onClick={() => setForm({...form, difficulty: d})}
                style={{ ...styles.diffBtn,
                  background: form.difficulty === d ? '#EAF3DE' : '#fff',
                  borderColor: form.difficulty === d ? '#27500A' : '#ddd',
                  color: form.difficulty === d ? '#27500A' : '#666'
                }}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>🧭 Trail path — step by step</div>
          <p style={styles.hint}>Describe each landmark clearly — this is what guides the next visitor</p>
          {waypoints.map((wp, i) => (
            <div key={i} style={styles.waypointRow}>
              <div style={styles.wpNum}>{i === 0 ? 'S' : i}</div>
              <div style={styles.wpFields}>
                <input style={styles.input} placeholder={i === 0 ? 'Starting point' : `Waypoint ${i} title`}
                  value={wp.title} onChange={e => handleWaypointChange(i, 'title', e.target.value)} />
                <textarea style={styles.textarea}
                  placeholder={i === 0 ? 'Where to park, how to begin...' : 'Describe the landmark, turn, or direction clearly'}
                  value={wp.description} onChange={e => handleWaypointChange(i, 'description', e.target.value)} />
              </div>
              {waypoints.length > 1 &&
                <button style={styles.removeBtn} onClick={() => removeWaypoint(i)}>✕</button>}
            </div>
          ))}
          <button style={styles.addWpBtn} onClick={addWaypoint}>+ Add next waypoint</button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>📖 Story mode</div>
          <p style={styles.hint}>Tell the next visitor your experience — what surprised you, what you wish you knew</p>
          <textarea style={{...styles.textarea, minHeight:'100px'}} name="story"
            placeholder="I found this place by accident while hiking... the water was crystal clear..."
            value={form.story} onChange={handleChange} />
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>⚠ Challenges & warnings</div>
          <textarea style={styles.textarea} name="challenges"
            placeholder="No signal after the pine fork. Slippery in monsoon. River crossing waist-deep in July..."
            value={form.challenges} onChange={handleChange} />
        </div>

        <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : '✓ Submit trail path'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#F9FAF7', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  container: { maxWidth: '680px', margin: '0 auto', padding: '24px 16px' },
  title: { fontSize: '22px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px' },
  sub: { fontSize: '14px', color: '#666', marginBottom: '20px' },
  error: { background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px',
           borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  card: { background: '#fff', border: '1px solid #E0E0E0', borderRadius: '12px',
          padding: '16px', marginBottom: '16px' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' },
  label: { fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
           borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
              borderRadius: '8px', marginBottom: '12px', minHeight: '70px',
              resize: 'vertical', boxSizing: 'border-box' },
  diffRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  diffBtn: { flex: 1, padding: '8px', fontSize: '13px', border: '1px solid #ddd',
             borderRadius: '8px', cursor: 'pointer' },
  hint: { fontSize: '12px', color: '#888', marginBottom: '12px', marginTop: '-8px' },
  waypointRow: { display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' },
  wpNum: { width: '28px', height: '28px', borderRadius: '50%', background: '#EAF3DE',
           color: '#27500A', display: 'flex', alignItems: 'center', justifyContent: 'center',
           fontSize: '12px', fontWeight: '600', flexShrink: 0, marginTop: '8px' },
  wpFields: { flex: 1 },
  removeBtn: { background: 'none', border: 'none', color: '#A32D2D', cursor: 'pointer',
               fontSize: '16px', marginTop: '8px' },
  addWpBtn: { background: '#EAF3DE', border: '1px solid #639922', color: '#27500A',
              padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  submitBtn: { width: '100%', padding: '14px', background: '#27500A', border: 'none',
               borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600',
               cursor: 'pointer', marginTop: '8px' }
};

export default AddTrail;