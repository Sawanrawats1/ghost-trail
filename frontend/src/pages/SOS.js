import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';

function SOS() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [shared, setShared] = useState(false);

  // Emergency contact state
  const [contact, setContact] = useState(null); // { name, email }
  const [loadingContact, setLoadingContact] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', email: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [editingContact, setEditingContact] = useState(false);

  // SOS alert state
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null); // { type: 'success'|'error', message }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
            accuracy: Math.round(pos.coords.accuracy)
          });
        },
        (err) => setLocError('Could not get location — check browser permissions'),
        { enableHighAccuracy: true }
      );
    } else {
      setLocError('Geolocation not supported on this device');
    }
  }, []);

  useEffect(() => {
    if (!token) { setLoadingContact(false); return; }
    axios.get('http://localhost:5000/api/auth/me', authHeaders)
      .then(res => {
        const { emergencyContactName, emergencyContactEmail } = res.data;
        if (emergencyContactEmail) {
          setContact({ name: emergencyContactName, email: emergencyContactEmail });
        } else {
          setEditingContact(true); // no contact yet — show the form immediately
        }
        setLoadingContact(false);
      })
      .catch(() => setLoadingContact(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const saveContact = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim()) {
      alert('Please enter both a name and email for your emergency contact.');
      return;
    }
    setSavingContact(true);
    try {
      const res = await axios.put(
        'http://localhost:5000/api/auth/emergency-contact',
        contactForm,
        authHeaders
      );
      setContact({ name: res.data.emergencyContactName, email: res.data.emergencyContactEmail });
      setEditingContact(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save emergency contact');
    }
    setSavingContact(false);
  };

  const sendSOSAlert = async () => {
    if (!location) {
      alert('Still getting your location — please wait a moment and try again.');
      return;
    }
    if (!contact) {
      setEditingContact(true);
      return;
    }
    setSendingAlert(true);
    setAlertStatus(null);
    try {
      const res = await axios.post('http://localhost:5000/api/sos/alert', {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy
      }, authHeaders);
      setAlertStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setAlertStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to send alert. Try calling 112 directly.'
      });
    }
    setSendingAlert(false);
  };

  const shareLocation = () => {
    if (location) {
      const text = `🆘 I need help! My location: https://maps.google.com/?q=${location.lat},${location.lng}`;
      if (navigator.share) {
        navigator.share({ title: 'SOS - My Location', text });
      } else {
        navigator.clipboard.writeText(text);
        setShared(true);
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}>🆘</div>
        <h1 style={styles.heroTitle}>Need help?</h1>
        <p style={styles.heroSub}>Your location is being tracked. Use the options below.</p>
      </div>

      <div style={styles.container}>

        <div style={styles.locCard}>
          <div style={styles.locIcon}>📍</div>
          <div>
            {location ? (
              <>
                <div style={styles.coords}>{location.lat}° N, {location.lng}° E</div>
                <div style={styles.accuracy}>Accuracy ±{location.accuracy}m · updating live</div>
              </>
            ) : locError ? (
              <div style={styles.locErr}>{locError}</div>
            ) : (
              <div style={styles.locLoading}>Getting your location...</div>
            )}
          </div>
        </div>

        {/* Real SOS alert — emails the saved emergency contact with live location */}
        {token && !loadingContact && (
          <div style={styles.sosCard}>
            {!editingContact && contact && (
              <>
                <div style={styles.sosCardHeader}>
                  <div style={styles.sosCardTitle}>🚨 Send SOS Alert</div>
                  <button style={styles.changeContactBtn} onClick={() => {
                    setContactForm({ name: contact.name, email: contact.email });
                    setEditingContact(true);
                  }}>Change contact</button>
                </div>
                <div style={styles.sosCardSub}>
                  Will email <strong>{contact.name}</strong> ({contact.email}) with your live GPS location
                </div>
                <button style={styles.sendAlertBtn} onClick={sendSOSAlert} disabled={sendingAlert || !location}>
                  {sendingAlert ? 'Sending alert...' : '🚨 Send SOS Alert Now'}
                </button>
                {alertStatus && (
                  <div style={{
                    ...styles.alertStatus,
                    background: alertStatus.type === 'success' ? '#EAF3DE' : '#FCEBEB',
                    color: alertStatus.type === 'success' ? '#27500A' : '#A32D2D'
                  }}>
                    {alertStatus.type === 'success' ? '✓ ' : '⚠ '}{alertStatus.message}
                  </div>
                )}
              </>
            )}

            {editingContact && (
              <>
                <div style={styles.sosCardTitle}>Set your emergency contact</div>
                <div style={styles.sosCardSub}>
                  Add someone who should be emailed with your live location if you hit SOS
                </div>
                <input style={styles.input} placeholder="Contact name"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
                <input style={styles.input} placeholder="Contact email" type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
                <div style={styles.contactBtnRow}>
                  {contact && (
                    <button style={styles.cancelBtn} onClick={() => setEditingContact(false)} disabled={savingContact}>
                      Cancel
                    </button>
                  )}
                  <button style={styles.saveContactBtn} onClick={saveContact} disabled={savingContact}>
                    {savingContact ? 'Saving...' : 'Save contact'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!token && (
          <div style={styles.loginPrompt}>
            <Link to="/auth" style={styles.loginLink}>Log in</Link> to set an emergency contact and send real SOS alerts
          </div>
        )}

        <a href="tel:112" style={styles.callBtn}>
          📞 Call 112 — Emergency Services
          <span style={styles.callSub}>Shares your GPS coordinates</span>
        </a>

        <button style={styles.actionBtn} onClick={shareLocation}>
          <span style={styles.actionIcon}>📤</span>
          <div>
            <div style={styles.actionTitle}>Share location with a contact</div>
            <div style={styles.actionSub}>Sends Google Maps link via WhatsApp or SMS</div>
          </div>
        </button>
        {shared && <div style={styles.copied}>✓ Location link copied to clipboard!</div>}

        <button style={styles.actionBtn} onClick={() => navigate(-1)}>
          <span style={styles.actionIcon}>🔄</span>
          <div>
            <div style={styles.actionTitle}>Retrace my steps</div>
            <div style={styles.actionSub}>Go back to the trail path you were following</div>
          </div>
        </button>

        <div style={styles.tipsCard}>
          <div style={styles.tipsTitle}>Stay safe while you wait</div>
          <div style={styles.tip}>• Stay where you are — moving makes you harder to find</div>
          <div style={styles.tip}>• Make noise periodically — shout, whistle, or bang rocks</div>
          <div style={styles.tip}>• Stay warm and find shelter from wind if possible</div>
          <div style={styles.tip}>• Conserve phone battery — reduce screen brightness</div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { background: '#F9FAF7', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  hero: { background: '#A32D2D', padding: '32px 24px', textAlign: 'center' },
  heroIcon: { fontSize: '48px' },
  heroTitle: { color: '#fff', fontSize: '24px', fontWeight: '600', margin: '8px 0 4px' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 },
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px 16px' },
  locCard: { background: '#EAF3DE', border: '1px solid #639922', borderRadius: '12px',
             padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center',
             marginBottom: '14px' },
  locIcon: { fontSize: '24px' },
  coords: { fontSize: '16px', fontWeight: '600', color: '#27500A', fontFamily: 'monospace' },
  accuracy: { fontSize: '12px', color: '#639922', marginTop: '3px' },
  locErr: { fontSize: '13px', color: '#A32D2D' },
  locLoading: { fontSize: '13px', color: '#639922' },
  sosCard: { background: '#fff', border: '2px solid #A32D2D', borderRadius: '12px',
             padding: '16px', marginBottom: '14px' },
  sosCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sosCardTitle: { fontSize: '15px', fontWeight: '700', color: '#A32D2D' },
  sosCardSub: { fontSize: '12px', color: '#666', margin: '4px 0 12px' },
  changeContactBtn: { background: 'none', border: 'none', color: '#185FA5',
                      fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' },
  sendAlertBtn: { width: '100%', padding: '14px', background: '#A32D2D', border: 'none',
                  borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '700',
                  cursor: 'pointer' },
  alertStatus: { marginTop: '10px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' },
  input: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ddd',
           borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box' },
  contactBtnRow: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px',
               border: '1px solid #ddd', background: '#fff', color: '#444', cursor: 'pointer' },
  saveContactBtn: { flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px',
                    border: 'none', background: '#27500A', color: '#fff', fontWeight: '500',
                    cursor: 'pointer' },
  loginPrompt: { background: '#FAEEDA', border: '1px solid #E8C97A', borderRadius: '10px',
                 padding: '12px 16px', fontSize: '13px', color: '#854F0B', marginBottom: '14px' },
  loginLink: { color: '#854F0B', fontWeight: '600' },
  callBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center',
             background: '#A32D2D', color: '#fff', textDecoration: 'none',
             padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
             marginBottom: '12px', textAlign: 'center' },
  callSub: { fontSize: '12px', fontWeight: '400', opacity: 0.85, marginTop: '4px' },
  actionBtn: { width: '100%', background: '#fff', border: '1px solid #E0E0E0',
               borderRadius: '12px', padding: '14px 16px', display: 'flex',
               alignItems: 'center', gap: '12px', cursor: 'pointer',
               marginBottom: '12px', textAlign: 'left' },
  actionIcon: { fontSize: '24px', flexShrink: 0 },
  actionTitle: { fontSize: '14px', fontWeight: '500', color: '#1A1A1A' },
  actionSub: { fontSize: '12px', color: '#666', marginTop: '3px' },
  copied: { background: '#EAF3DE', color: '#27500A', padding: '8px 14px',
            borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  tipsCard: { background: '#fff', border: '1px solid #E0E0E0', borderRadius: '12px',
              padding: '16px', marginTop: '4px' },
  tipsTitle: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '10px' },
  tip: { fontSize: '13px', color: '#555', padding: '4px 0', lineHeight: '1.5' }
};

export default SOS;