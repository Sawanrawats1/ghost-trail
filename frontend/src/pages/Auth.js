import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';

function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const url = `http://localhost:5000/api/auth/${mode}`;
      const body = mode === 'register'
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };
      const res = await axios.post(url, body);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🌿 Ghost Trail</div>
        <h2 style={styles.title}>
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </h2>

        {error && <div style={styles.error}>{error}</div>}

        {mode === 'register' && (
          <>
            <label style={styles.label}>Your name</label>
            <input style={styles.input} name="name" placeholder="e.g. Rahul Kumar"
              value={form.name} onChange={handleChange} />
          </>
        )}

        <label style={styles.label}>Email</label>
        <input style={styles.input} name="email" type="email" placeholder="you@example.com"
          value={form.email} onChange={handleChange} />

        <label style={styles.label}>Password</label>
        <input style={styles.input} name="password" type="password" placeholder="Min 6 characters"
          value={form.password} onChange={handleChange} />

        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={styles.switch}>
          {mode === 'login' ? (
            <>No account? <span style={styles.link} onClick={() => setMode('register')}>Register here</span></>
          ) : (
            <>Already registered? <span style={styles.link} onClick={() => setMode('login')}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#F9FAF7', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' },
  card: { background: '#fff', border: '1px solid #E0E0E0', borderRadius: '16px',
          padding: '32px', width: '100%', maxWidth: '400px' },
  logo: { fontSize: '24px', fontWeight: '600', color: '#27500A', marginBottom: '8px' },
  title: { fontSize: '18px', color: '#1A1A1A', marginBottom: '20px', fontWeight: '500' },
  error: { background: '#FCEBEB', color: '#A32D2D', padding: '10px 12px',
           borderRadius: '8px', fontSize: '13px', marginBottom: '14px' },
  label: { fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ddd',
           borderRadius: '8px', marginBottom: '14px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', background: '#27500A', border: 'none',
         borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '500',
         cursor: 'pointer', marginBottom: '16px' },
  switch: { textAlign: 'center', fontSize: '13px', color: '#666' },
  link: { color: '#27500A', fontWeight: '500', cursor: 'pointer' }
};

export default Auth;