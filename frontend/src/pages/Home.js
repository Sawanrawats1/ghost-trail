import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine formula — great-circle distance between two lat/lng points, in km.
// Standard approach for "as the crow flies" distance on a sphere; accurate
// enough for trail discovery (doesn't account for actual road/trail routing).
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Home() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | granted | denied
  const [sortByDistance, setSortByDistance] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api/trails')
      .then(res => { setTrails(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const findNearMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
        setSortByDistance(true);
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getTrailCoords = (trail) => trail.waypoints?.find(w => w.lat && w.lng);

  const getDistance = (trail) => {
    if (!userLocation) return null;
    const wp = getTrailCoords(trail);
    if (!wp) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, wp.lat, wp.lng);
  };

  const getFreshness = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days > 180) return { label: '⚠ Needs review', color: '#A32D2D', bg: '#FCEBEB' };
    if (days > 90) return { label: '⚡ May have changed', color: '#854F0B', bg: '#FAEEDA' };
    return { label: '✓ Fresh', color: '#27500A', bg: '#EAF3DE' };
  };

  const getIcon = (type) => {
    const icons = { waterfall: '🌊', lake: '🏔', cave: '🕳', meadow: '🌿', river: '🏞', summit: '⛰' };
    return icons[type] || '📍';
  };

  let filtered = trails.filter(t => {
    const matchFilter = filter === 'all' || t.type === filter;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.location.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (sortByDistance && userLocation) {
    filtered = [...filtered].sort((a, b) => {
      const distA = getDistance(a);
      const distB = getDistance(b);
      if (distA === null) return 1;
      if (distB === null) return -1;
      return distA - distB;
    });
  }

  const trailsWithCoords = trails.filter(t => t.waypoints?.some(w => w.lat && w.lng));
  const mapCenter = trailsWithCoords.length > 0
    ? [trailsWithCoords[0].waypoints.find(w => w.lat)?.lat, trailsWithCoords[0].waypoints.find(w => w.lat)?.lng]
    : [30.0, 78.5];

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'lake', label: '🏔 Lake' },
    { key: 'cave', label: '🕳 Cave' },
    { key: 'waterfall', label: '🌊 Waterfall' },
    { key: 'meadow', label: '🌿 Meadow' },
    { key: 'river', label: '🏞 River' },
    { key: 'summit', label: '⛰ Summit' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.heroWrap}>
        <MapContainer center={mapCenter} zoom={9}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          {trailsWithCoords.map(trail => {
            const wp = trail.waypoints.find(w => w.lat && w.lng);
            return wp ? (
              <Marker key={trail._id} position={[wp.lat, wp.lng]}>
                <Popup>
                  <strong>{trail.name}</strong><br/>
                  {trail.location}<br/>
                  <a href={`/trail/${trail._id}`} style={{color:'#27500A'}}>View trail →</a>
                </Popup>
              </Marker>
            ) : null;
          })}
        </MapContainer>
        <div style={styles.heroOverlay}>
          <div style={styles.offGridBadge}>🛰 Off-grid only</div>
          <div style={styles.heroBottom}>
            <h1 style={styles.heroTitle}>Ghost Trail</h1>
            <p style={styles.heroSub}>Paths drawn by the few who found them — follow exactly, get there safely</p>
          </div>
        </div>
      </div>

      <div style={styles.searchWrap}>
        <div style={styles.searchBar}>
          <span>🔍</span>
          <input style={styles.searchInput}
            placeholder="Search hidden lakes, caves, meadows…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={styles.nearMeWrap}>
        {locationStatus !== 'granted' && (
          <button style={styles.nearMeBtn} onClick={findNearMe} disabled={locationStatus === 'loading'}>
            📍 {locationStatus === 'loading' ? 'Finding your location...' : 'Find trails near me'}
          </button>
        )}
        {locationStatus === 'granted' && (
          <div style={styles.nearMeActive}>
            <span>📍 Sorted by distance from you</span>
            <button style={styles.nearMeToggle} onClick={() => setSortByDistance(!sortByDistance)}>
              {sortByDistance ? 'Show default order' : 'Sort by distance'}
            </button>
          </div>
        )}
        {locationStatus === 'denied' && (
          <div style={styles.nearMeDenied}>Couldn't get your location — check browser permissions</div>
        )}
      </div>

      <div style={styles.filtersWrap}>
        {filters.map(f => (
          <button key={f.key} style={{
            ...styles.filterPill,
            background: filter === f.key ? '#27500A' : '#fff',
            color: filter === f.key ? '#fff' : '#444',
            border: filter === f.key ? '1px solid #27500A' : '1px solid #ddd'
          }} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={styles.listWrap}>
        {loading && <div style={styles.emptyState}><div style={styles.emptyIcon}>🌿</div><p>Loading...</p></div>}

        {!loading && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🗺</div>
            <div style={styles.emptyTitle}>No spots found</div>
            <div style={styles.emptyText}>Be the first to share one</div>
            <Link to="/add" style={styles.emptyBtn}>+ Share a spot</Link>
          </div>
        )}

        {filtered.map(trail => {
          const freshness = getFreshness(trail.lastConfirmedDate);
          const days = Math.floor((new Date() - new Date(trail.lastConfirmedDate)) / (1000*60*60*24));
          const health = trail.healthScore;
          const distance = getDistance(trail);
          return (
            <Link to={`/trail/${trail._id}`} key={trail._id} style={styles.cardLink}>
              <div style={styles.card}>
                <div style={styles.cardMain}>
                  <div style={styles.cardIcon}>{getIcon(trail.type)}</div>
                  <div style={styles.cardBody}>
                    <div style={styles.cardTopRow}>
                      <div style={styles.cardName}>{trail.name}</div>
                      {health && (
                        <div style={{ ...styles.healthBadge, background: health.bg, color: health.color }}
                          title={`Freshness: ${health.breakdown?.freshnessScore} · Risk: ${health.breakdown?.riskScore}`}>
                          {health.score} · {health.label}
                        </div>
                      )}
                    </div>
                    <div style={styles.cardLoc}>
                      📍 {trail.location}
                      {distance !== null && (
                        <span style={styles.distanceTag}> · {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} away</span>
                      )}
                    </div>
                    <div style={styles.cardTags}>
                      <span style={styles.tagDiff}>{trail.difficulty}</span>
                      <span style={styles.tagType}>{trail.type}</span>
                      <span style={{ ...styles.tagFresh, background: freshness.bg, color: freshness.color }}>
                        {freshness.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={styles.cardStrip}>
                  <span>🗺 {trail.waypoints?.length || 0} waypoints</span>
                  <span>·</span>
                  <span>👤 {trail.createdBy || 'Anonymous'}</span>
                  <span>·</span>
                  <span style={{ color: freshness.color }}>
                    {days === 0 ? 'Today' : `${days}d ago`}
                  </span>
                  {trail.comments?.length > 0 && (<><span>·</span><span>💬 {trail.comments.length}</span></>)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={styles.bottomNav}>
        <button style={styles.bottomBtn} onClick={() => navigate('/')}>
          <span style={styles.bottomIcon}>🧭</span>
          <span style={styles.bottomLabel}>Explore</span>
        </button>
        <button style={styles.bottomBtn} onClick={() => navigate('/add')}>
          <span style={styles.bottomIcon}>📍</span>
          <span style={styles.bottomLabel}>Leave a Path</span>
        </button>
        <button style={styles.bottomBtn} onClick={() => navigate('/my-trails')}>
          <span style={styles.bottomIcon}>🔖</span>
          <span style={styles.bottomLabel}>My Trails</span>
        </button>
        <button style={{ ...styles.bottomBtn, color: '#A32D2D' }} onClick={() => navigate('/sos')}>
          <span style={styles.bottomIcon}>🆘</span>
          <span style={styles.bottomLabel}>SOS</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#F4F6F1', minHeight: '100vh', fontFamily: 'Arial, sans-serif',
          paddingBottom: '70px' },
  heroWrap: { position: 'relative', height: '260px' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(20,50,5,0.75) 100%)',
                 display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                 padding: '12px 16px 16px' },
  offGridBadge: { alignSelf: 'flex-end', background: 'rgba(255,255,255,0.9)',
                  border: '1px solid #C0DD97', borderRadius: '20px', padding: '4px 12px',
                  fontSize: '11px', color: '#27500A', fontWeight: '500' },
  heroBottom: { color: '#fff' },
  heroTitle: { fontSize: '26px', fontWeight: '700', margin: '0 0 4px', color: '#fff' },
  heroSub: { fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 },
  searchWrap: { padding: '12px 16px 0' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff',
               border: '1px solid #E0E0E0', borderRadius: '12px', padding: '10px 14px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent' },
  nearMeWrap: { padding: '10px 16px 0' },
  nearMeBtn: { width: '100%', padding: '11px', background: '#fff', border: '1px solid #27500A',
               borderRadius: '10px', color: '#27500A', fontSize: '13px', fontWeight: '600',
               cursor: 'pointer' },
  nearMeActive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#EAF3DE', border: '1px solid #639922', borderRadius: '10px',
                  padding: '10px 14px', fontSize: '12px', color: '#27500A' },
  nearMeToggle: { background: 'none', border: 'none', color: '#185FA5', fontSize: '12px',
                  fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' },
  nearMeDenied: { fontSize: '12px', color: '#A32D2D', padding: '8px 4px' },
  distanceTag: { color: '#185FA5', fontWeight: '600' },
  filtersWrap: { display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto' },
  filterPill: { padding: '6px 14px', fontSize: '12px', borderRadius: '20px',
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' },
  listWrap: { padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardLink: { textDecoration: 'none' },
  card: { background: '#fff', border: '1px solid #E4E8DF', borderRadius: '14px', overflow: 'hidden' },
  cardMain: { display: 'flex', alignItems: 'stretch' },
  cardIcon: { width: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', background: '#EAF3DE', flexShrink: 0 },
  cardBody: { padding: '11px 14px', flex: 1 },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  cardName: { fontSize: '15px', fontWeight: '600', color: '#1A1A1A' },
  healthBadge: { fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px',
                 whiteSpace: 'nowrap', flexShrink: 0 },
  cardLoc: { fontSize: '12px', color: '#777', margin: '3px 0 7px' },
  cardTags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tagDiff: { fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: '#F0F0F0', color: '#555' },
  tagType: { fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: '#E6F1FB', color: '#185FA5' },
  tagFresh: { fontSize: '10px', padding: '2px 8px', borderRadius: '10px' },
  cardStrip: { display: 'flex', gap: '8px', alignItems: 'center', padding: '7px 14px',
               background: '#F8FAF6', borderTop: '1px solid #EEF0EA',
               fontSize: '11px', color: '#777', flexWrap: 'wrap' },
  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyIcon: { fontSize: '36px', marginBottom: '10px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' },
  emptyText: { fontSize: '13px', color: '#888', marginBottom: '14px' },
  emptyBtn: { background: '#27500A', color: '#fff', padding: '10px 22px',
              borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
               borderTop: '1px solid #E0E0E0', display: 'flex', zIndex: 100 },
  bottomBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
               justifyContent: 'center', padding: '10px 4px', background: 'none',
               border: 'none', cursor: 'pointer', color: '#444', gap: '3px' },
  bottomIcon: { fontSize: '20px' },
  bottomLabel: { fontSize: '10px', fontWeight: '500' }
};

export default Home;