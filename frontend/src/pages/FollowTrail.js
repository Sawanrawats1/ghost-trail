import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Auto-center map on user position
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 15);
  }, [position, map]);
  return null;
}

// Calculate distance between two GPS points in meters
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function FollowTrail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [completed, setCompleted] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/trails/${id}`)
      .then(res => {
        const sorted = res.data;
        sorted.waypoints = sorted.waypoints?.sort((a,b) => a.order - b.order);
        setTrail(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(newPos);

        if (trail?.waypoints?.[currentStep]?.lat && trail?.waypoints?.[currentStep]?.lng) {
          const wp = trail.waypoints[currentStep];
          const dist = getDistance(newPos.lat, newPos.lng, wp.lat, wp.lng);
          setDistance(Math.round(dist));
          setArrived(dist < 50);
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [trail, currentStep]);

  const nextStep = () => {
    if (currentStep < trail.waypoints.length - 1) {
      setCurrentStep(currentStep + 1);
      setArrived(false);
      setDistance(null);
    } else {
      setCompleted(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setArrived(false);
      setDistance(null);
    }
  };

  if (loading) return <div style={styles.loading}>Loading trail...</div>;
  if (!trail) return <div style={styles.loading}>Trail not found.</div>;

  const waypoints = trail.waypoints || [];
  const wp = waypoints[currentStep];
  const progress = ((currentStep + 1) / waypoints.length) * 100;
  const hasCoords = wp?.lat && wp?.lng;

  if (completed) {
    return (
      <div style={styles.page}>
        <div style={styles.completedCard}>
          <div style={styles.completedIcon}>🎉</div>
          <h2 style={styles.completedTitle}>You made it!</h2>
          <p style={styles.completedSub}>You've reached <strong>{trail.name}</strong></p>
          <p style={styles.completedSub}>Please confirm the trail is still accurate for future visitors.</p>
          <button style={styles.confirmBtn} onClick={async () => {
            await axios.put(`http://localhost:5000/api/trails/${id}/confirm`);
            navigate(`/trail/${id}`);
          }}>✓ Confirm trail is accurate</button>
          <button style={styles.skipBtn} onClick={() => navigate(`/trail/${id}`)}>
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(`/trail/${id}`)}>✕ Exit</button>
        <div style={styles.headerTitle}>{trail.name}</div>
        <button style={styles.sosSmall} onClick={() => navigate('/sos')}>SOS</button>
      </div>

      {/* Progress bar */}
      <div style={styles.progressWrap}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={styles.progressText}>
          Waypoint {currentStep + 1} of {waypoints.length}
        </div>
      </div>

      {/* Distance tracker — like food delivery ETA */}
      {hasCoords && (
        <div style={{
          ...styles.distanceCard,
          background: arrived ? '#EAF3DE' : distance < 200 ? '#FAEEDA' : '#fff',
          borderColor: arrived ? '#27500A' : distance < 200 ? '#BA7517' : '#E0E0E0'
        }}>
          <div style={styles.distanceRow}>
            <div>
              <div style={styles.distanceLabel}>Distance to next waypoint</div>
              <div style={{
                ...styles.distanceValue,
                color: arrived ? '#27500A' : distance < 200 ? '#854F0B' : '#1A1A1A'
              }}>
                {distance !== null
                  ? arrived ? '✓ You\'re here!' : distance < 1000
                    ? `${distance} m away`
                    : `${(distance/1000).toFixed(1)} km away`
                  : 'Getting your location...'}
              </div>
            </div>
            <div style={styles.distanceIcon}>
              {arrived ? '📍' : distance < 200 ? '🔥' : '🧭'}
            </div>
          </div>
          {arrived && (
            <div style={styles.arrivedBanner}>
              You're within 50m of this waypoint — tap Next when ready
            </div>
          )}
        </div>
      )}

      {/* Map */}
      {(hasCoords || userPos) && (
        <div style={styles.mapWrap}>
          <MapContainer
            center={userPos ? [userPos.lat, userPos.lng] : [wp.lat, wp.lng]}
            zoom={15}
            style={{ height: '180px', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]}>
                  <Popup>You are here</Popup>
                </Marker>
                <Circle center={[userPos.lat, userPos.lng]} radius={50}
                  color="#185FA5" fillColor="#185FA5" fillOpacity={0.15}/>
              </>
            )}
            {hasCoords && (
              <Marker position={[wp.lat, wp.lng]}>
                <Popup><strong>{wp.title}</strong></Popup>
              </Marker>
            )}
            {userPos && <MapUpdater position={userPos}/>}
          </MapContainer>
        </div>
      )}

      {/* Current waypoint card */}
      <div style={styles.waypointCard}>
        <div style={styles.wpBadge}>
          {currentStep === 0 ? 'START' : currentStep === waypoints.length - 1 ? 'DESTINATION' : `STEP ${currentStep}`}
        </div>
        <div style={styles.wpTitle}>{wp?.title}</div>
        <div style={styles.wpDesc}>{wp?.description}</div>
      </div>

      {/* All waypoints mini list */}
      <div style={styles.allSteps}>
        {waypoints.map((w, i) => (
          <div key={i} style={{
            ...styles.stepDot,
            background: i < currentStep ? '#27500A' : i === currentStep ? '#639922' : '#ddd'
          }}>
            {i < currentStep ? '✓' : i + 1}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div style={styles.navBtns}>
        <button style={{
          ...styles.prevBtn,
          opacity: currentStep === 0 ? 0.4 : 1
        }} onClick={prevStep} disabled={currentStep === 0}>
          ← Previous
        </button>
        <button style={styles.nextBtn} onClick={nextStep}>
          {currentStep === waypoints.length - 1 ? '🎉 I arrived!' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#F9FAF7', minHeight: '100vh', fontFamily: 'Arial, sans-serif',
          display: 'flex', flexDirection: 'column' },
  loading: { padding: '40px', textAlign: 'center', color: '#666' },
  header: { background: '#27500A', padding: '12px 16px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
             padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  headerTitle: { color: '#fff', fontSize: '15px', fontWeight: '500',
                 textAlign: 'center', flex: 1, margin: '0 10px',
                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sosSmall: { background: '#A32D2D', border: 'none', color: '#fff',
              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600' },
  progressWrap: { padding: '12px 16px 8px', background: '#fff',
                  borderBottom: '1px solid #E0E0E0' },
  progressBar: { background: '#E0E0E0', borderRadius: '10px', height: '6px',
                 overflow: 'hidden', marginBottom: '6px' },
  progressFill: { background: '#639922', height: '100%', borderRadius: '10px',
                  transition: 'width 0.4s ease' },
  progressText: { fontSize: '12px', color: '#666', textAlign: 'right' },
  distanceCard: { margin: '12px 16px', padding: '14px', borderRadius: '12px',
                  border: '1px solid #E0E0E0', background: '#fff' },
  distanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  distanceLabel: { fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' },
  distanceValue: { fontSize: '22px', fontWeight: '700', color: '#1A1A1A' },
  distanceIcon: { fontSize: '32px' },
  arrivedBanner: { marginTop: '10px', padding: '8px 10px', background: '#27500A',
                   color: '#fff', borderRadius: '8px', fontSize: '12px', textAlign: 'center' },
  mapWrap: { margin: '0 16px 12px', borderRadius: '12px', overflow: 'hidden',
             border: '1px solid #E0E0E0' },
  waypointCard: { margin: '0 16px 12px', background: '#fff', border: '1px solid #E0E0E0',
                  borderRadius: '12px', padding: '16px', flex: 1 },
  wpBadge: { fontSize: '10px', fontWeight: '700', color: '#639922', letterSpacing: '0.1em',
             marginBottom: '6px' },
  wpTitle: { fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
  wpDesc: { fontSize: '14px', color: '#555', lineHeight: '1.6' },
  allSteps: { display: 'flex', gap: '6px', justifyContent: 'center',
              padding: '8px 16px', flexWrap: 'wrap' },
  stepDot: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
             alignItems: 'center', justifyContent: 'center', fontSize: '11px',
             fontWeight: '600', color: '#fff', flexShrink: 0 },
  navBtns: { display: 'flex', gap: '10px', padding: '12px 16px',
             background: '#fff', borderTop: '1px solid #E0E0E0' },
  prevBtn: { flex: 1, padding: '14px', background: '#fff', border: '1px solid #E0E0E0',
             borderRadius: '12px', fontSize: '15px', cursor: 'pointer', color: '#444' },
  nextBtn: { flex: 2, padding: '14px', background: '#27500A', border: 'none',
             borderRadius: '12px', fontSize: '15px', fontWeight: '600',
             color: '#fff', cursor: 'pointer' },
  completedCard: { margin: '40px 20px', background: '#fff', border: '1px solid #E0E0E0',
                   borderRadius: '16px', padding: '32px', textAlign: 'center' },
  completedIcon: { fontSize: '56px', marginBottom: '12px' },
  completedTitle: { fontSize: '24px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
  completedSub: { fontSize: '14px', color: '#666', marginBottom: '8px' },
  confirmBtn: { width: '100%', padding: '14px', background: '#27500A', border: 'none',
                borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer', marginTop: '16px', marginBottom: '8px' },
  skipBtn: { width: '100%', padding: '12px', background: 'none', border: '1px solid #ddd',
             borderRadius: '12px', color: '#666', fontSize: '14px', cursor: 'pointer' }
};

export default FollowTrail;