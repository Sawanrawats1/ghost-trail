import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password) {
  if (!password) return { valid: false, strength: null, message: '' };
  if (password.length < 8) {
    return { valid: false, strength: 'weak', message: 'At least 8 characters required' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, strength: 'weak', message: 'Add at least one letter and one number' };
  }
  if (hasUpper && hasSpecial && password.length >= 10) {
    return { valid: true, strength: 'strong', message: 'Strong password' };
  }
  if (hasUpper || hasSpecial) {
    return { valid: true, strength: 'medium', message: 'Good — add a symbol or capital for extra strength' };
  }
  return { valid: true, strength: 'medium', message: 'Acceptable — could be stronger' };
}

function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live validation state
  const [emailStatus, setEmailStatus] = useState({ checking: false, available: null, message: '' });
  const [passwordCheck, setPasswordCheck] = useState({ valid: false, strength: null, message: '' });
  const [touched, setTouched] = useState({});

  const emailCheckTimer = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));

    if (name === 'password') {
      setPasswordCheck(getPasswordStrength(value));
    }

    if (name === 'email' && mode === 'register') {
      setEmailStatus({ checking: false, available: null, message: '' });
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);

      if (!EMAIL_REGEX.test(value)) {
        setEmailStatus({ checking: false, available: null, message: value ? 'Enter a valid email address' : '' });
        return;
      }

      setEmailStatus({ checking: true, available: null, message: 'Checking availability...' });
      emailCheckTimer.current = setTimeout(async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/auth/check-email?email=${encodeURIComponent(value)}`);
          setEmailStatus({ checking: false, available: res.data.available, message: res.data.message });
        } catch {
          setEmailStatus({ checking: false, available: null, message: '' });
        }
      }, 500); // debounce, like Facebook/Google signup forms
    }
  };

  useEffect(() => {
    // Reset validation state when switching between login/register
    setError('');
    setEmailStatus({ checking: false, available: null, message: '' });
    setPasswordCheck({ valid: false, strength: null, message: '' });
    setTouched({});
  }, [mode]);

  const isRegisterValid =
    form.name.trim().length >= 2 &&
    EMAIL_REGEX.test(form.email) &&
    emailStatus.available === true &&
    passwordCheck.valid &&
    form.password === form.confirmPassword;

  const passwordsMismatch =
    mode === 'register' && touched.confirmPassword && form.confirmPassword && form.password !== form.confirmPassword;

  const handleSubmit = async () => {
    setError('');

    if (mode === 'register' && !isRegisterValid) {
      setError('Please fix the highlighted fields before continuing');
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:5000/api/auth/${mode}`;
      const body = mode === 'register'
        ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password };
      const res = await axios.post(url, body);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  const strengthColor = {
    weak: '#A32D2D',
    medium: '#854F0B',
    strong: '#27500A'
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
            {touched.name && form.name.trim().length > 0 && form.name.trim().length < 2 && (
              <div style={styles.fieldError}>Name must be at least 2 characters</div>
            )}
          </>
        )}

        <label style={styles.label}>Email</label>
        <input style={styles.input} name="email" type="email" placeholder="you@example.com"
          value={form.email} onChange={handleChange} />
        {mode === 'register' && form.email && (
          <div style={{
            ...styles.fieldHint,
            color: emailStatus.available === false ? '#A32D2D'
                 : emailStatus.available === true ? '#27500A'
                 : '#888'
          }}>
            {emailStatus.checking ? '⏳ Checking availability...' : emailStatus.message}
          </div>
        )}

        <label style={styles.label}>Password</label>
        <input style={styles.input} name="password" type="password" placeholder="Min 8 characters"
          value={form.password} onChange={handleChange} />
        {mode === 'register' && form.password && (
          <>
            <div style={styles.strengthBarWrap}>
              <div style={{
                ...styles.strengthBar,
                width: passwordCheck.strength === 'weak' ? '33%' : passwordCheck.strength === 'medium' ? '66%' : '100%',
                background: strengthColor[passwordCheck.strength] || '#ddd'
              }} />
            </div>
            <div style={{ ...styles.fieldHint, color: strengthColor[passwordCheck.strength] || '#888' }}>
              {passwordCheck.message}
            </div>
          </>
        )}

        {mode === 'register' && (
          <>
            <label style={styles.label}>Confirm password</label>
            <input style={styles.input} name="confirmPassword" type="password" placeholder="Re-enter your password"
              value={form.confirmPassword} onChange={handleChange} />
            {passwordsMismatch && (
              <div style={styles.fieldError}>Passwords do not match</div>
            )}
          </>
        )}

        <button style={{
          ...styles.btn,
          opacity: mode === 'register' && !isRegisterValid ? 0.5 : 1,
          cursor: mode === 'register' && !isRegisterValid ? 'not-allowed' : 'pointer'
        }} onClick={handleSubmit} disabled={loading || (mode === 'register' && !isRegisterValid)}>
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
           borderRadius: '8px', marginBottom: '4px', boxSizing: 'border-box' },
  fieldHint: { fontSize: '11px', marginBottom: '10px', minHeight: '14px' },
  fieldError: { fontSize: '11px', color: '#A32D2D', marginBottom: '10px' },
  strengthBarWrap: { width: '100%', height: '4px', background: '#eee', borderRadius: '2px',
                     marginTop: '4px', marginBottom: '4px', overflow: 'hidden' },
  strengthBar: { height: '100%', borderRadius: '2px', transition: 'width 0.2s ease' },
  btn: { width: '100%', padding: '12px', background: '#27500A', border: 'none',
         borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '500',
         marginBottom: '16px', marginTop: '6px' },
  switch: { textAlign: 'center', fontSize: '13px', color: '#666' },
  link: { color: '#27500A', fontWeight: '500', cursor: 'pointer' }
};

export default Auth;