import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SOS() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [shared, setShared] = useState(false);

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