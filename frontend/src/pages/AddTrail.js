import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function AddTrail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', location: '', type: 'waterfall',
    difficulty: 'moderate', description: '', story: '', challenges: ''
  });
  const [waypoints, setWaypoints] = useState([
    { order: 1, title: '', description: '', lat: null, lng: null }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect to login if not signed in
  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleWaypointChange = (index, field, value) => {
    const updated = [...waypoints];
    updated[index][field] = value;
    setWaypoints(updated);
  };

  const captureGPS = (index) => {
    if (!navigator.geolocation) { alert('GPS not available'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleWaypointChange(index, 'lat', pos.coords.latitude);
        handleWaypointChange(index, 'lng', pos.coords.longitude);
      },
      () => alert('Could not get location. Allow GPS in browser.')
    );
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints,
      { order: waypoints.length + 1, title: '', description: '', lat: null, lng: null }
    ]);
  };

  const removeWaypoint = (index) => {
    if (waypoints.length === 1) return;
    const updated = waypoints.filter((_, i) => i !== index)
      .map((wp, i) => ({ ...wp, order: i + 1 }));
    setWaypoints(updated);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.location) { setError('Name and location are required.'); return; }
    if (waypoints.some(wp => !wp.title || !wp.description)) {
      setError('Please fill in all waypoint fields.'); return;
    }
    setSubmitting(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/trails', {
        ...form,
        waypoints,
        createdBy: user ? user.name : 'Anonymous'
      });
      navigate('/');
    } catch (err) { setError('Failed to submit. Try again.'); setSubmitting(false); }
  };

  if (!user) return null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>🗺 Share a hidden spot</h2>
        <p style={styles.sub}>Your path helps the next visitor reach it safely</p>

        {/* Contributor badge */}
        <div style={styles.contributorBadge}>
          <div style={styles.contributorAvatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={styles.contributorName}>Submitting as {user.name}</div>
            <div style={styles.contributorSub}>Your name will appear on this trail</div>
          </div>
        </div>

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
            {['easy', 'moderate', 'hard'].map(d => (
              <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
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
          <p style={styles.hint}>Describe each landmark clearly — this guides the next visitor</p>
          {waypoints.map((wp, i) => (
            <div key={i} style={styles.waypointBlock}>
              <div style={styles.waypointHeader}>
                <div style={styles.wpNum}>{i === 0 ? 'S' : i}</div>
                <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#1A1A1A' }}>
                  {i === 0 ? 'Starting point' : `Waypoint ${i}`}
                </div>
                {waypoints.length > 1 && (
                  <button style={styles.removeBtn} onClick={() => removeWaypoint(i)}>✕</button>
                )}
              </div>
              <input style={styles.input}
                placeholder={i === 0 ? 'Where does the trail start?' : 'Landmark name or description'}
                value={wp.title} onChange={e => handleWaypointChange(i, 'title', e.target.value)} />
              <textarea style={styles.textarea}
                placeholder={i === 0 ? 'Where to park, how to begin...' : 'Exact directions — describe what the visitor will see'}
                value={wp.description} onChange={e => handleWaypointChange(i, 'description', e.target.value)} />
              <button style={{
                ...styles.gpsBtn,
                background: wp.lat ? '#EAF3DE' : '#fff',
                borderColor: wp.lat ? '#27500A' : '#ddd',
                color: wp.lat ? '#27500A' : '#666'
              }} onClick={() => captureGPS(i)}>
                📍 {wp.lat
                  ? `GPS captured (${Number(wp.lat).toFixed(4)}°, ${Number(wp.lng).toFixed(4)}°)`
                  : 'Capture my GPS at this waypoint'}
              </button>
            </div>
          ))}
          <button style={styles.addWpBtn} onClick={addWaypoint}>+ Add next waypoint</button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>📖 Story mode</div>
          <p style={styles.hint}>Tell the next visitor your experience — what surprised you, what you wish you knew</p>
          <textarea style={{ ...styles.textarea, minHeight: '100px' }} name="story"
            placeholder="I found this place by accident while hiking..."
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
  sub: { fontSize: '14px', color: '#666', marginBottom: '12px' },
  contributorBadge: { display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#EAF3DE', border: '1px solid #C0DD97',
                      borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' },
  contributorAvatar: { width: '36px', height: '36px', borderRadius: '50%',
                       background: '#27500A', color: '#fff', display: 'flex',
                       alignItems: 'center', justifyContent: 'center',
                       fontSize: '16px', fontWeight: '600', flexShrink: 0 },
  contributorName: { fontSize: '13px', fontWeight: '600', color: '#27500A' },
  contributorSub: { fontSize: '11px', color: '#639922', marginTop: '1px' },
  error: { background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px',
           borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  card: { background: '#fff', border: '1px solid #E0E0E0', borderRadius: '12px',
          padding: '16px', marginBottom: '16px' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' },
  label: { fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
           borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
              borderRadius: '8px', marginBottom: '10px', minHeight: '70px',
              resize: 'vertical', boxSizing: 'border-box' },
  diffRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  diffBtn: { flex: 1, padding: '8px', fontSize: '13px', border: '1px solid #ddd',
             borderRadius: '8px', cursor: 'pointer' },
  hint: { fontSize: '12px', color: '#888', marginBottom: '12px', marginTop: '-8px' },
  waypointBlock: { background: '#F9FAF7', border: '1px solid #E8E8E8', borderRadius: '10px',
                   padding: '12px', marginBottom: '10px' },
  waypointHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  wpNum: { width: '28px', height: '28px', borderRadius: '50%', background: '#EAF3DE',
           color: '#27500A', display: 'flex', alignItems: 'center', justifyContent: 'center',
           fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  removeBtn: { background: 'none', border: 'none', color: '#A32D2D', cursor: 'pointer', fontSize: '16px' },
  gpsBtn: { padding: '7px 14px', fontSize: '12px', border: '1px solid #ddd',
            borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', width: '100%',
            textAlign: 'left' },
  addWpBtn: { background: '#EAF3DE', border: '1px solid #639922', color: '#27500A',
              padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  submitBtn: { width: '100%', padding: '14px', background: '#27500A', border: 'none',
               borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600',
               cursor: 'pointer', marginTop: '8px' }
};

export default AddTrail;