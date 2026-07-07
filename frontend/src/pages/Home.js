import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/trails')
      .then(res => { setTrails(res.data); setLoading(false); })
      .catch(err => { console.log(err); setLoading(false); });
  }, []);

  const getFreshness = (lastConfirmedDate) => {
    const days = Math.floor((new Date() - new Date(lastConfirmedDate)) / (1000 * 60 * 60 * 24));
    if (days > 180) return { label: '⚠ Needs review', color: '#A32D2D' };
    if (days > 90) return { label: '⚡ May have changed', color: '#BA7517' };
    return { label: '✓ Fresh', color: '#27500A' };
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🌿 Ghost Trail</h1>
        <p style={styles.heroSub}>Hidden spots. Human paths. No signal needed.</p>
        <Link to="/add" style={styles.heroBtn}>+ Share a hidden spot</Link>
      </div>

      <div style={styles.container}>
        <h2 style={styles.sectionTitle}>Hidden spots near you</h2>
        {loading && <p>Loading trails...</p>}
        {!loading && trails.length === 0 && (
          <div style={styles.empty}>
            <p>No trails yet — be the first to add one!</p>
            <Link to="/add" style={styles.heroBtn}>+ Add first spot</Link>
          </div>
        )}
        <div style={styles.grid}>
          {trails.map(trail => {
            const freshness = getFreshness(trail.lastConfirmedDate);
            return (
              <Link to={`/trail/${trail._id}`} key={trail._id} style={styles.cardLink}>
                <div style={styles.card}>
                  <div style={styles.cardIcon}>
                    {trail.type === 'waterfall' ? '🌊' :
                     trail.type === 'lake' ? '🏔' :
                     trail.type === 'cave' ? '🕳' :
                     trail.type === 'meadow' ? '🌿' : '📍'}
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.cardName}>{trail.name}</div>
                    <div style={styles.cardLoc}>📍 {trail.location}</div>
                    <div style={styles.cardTags}>
                      <span style={styles.tag}>{trail.difficulty}</span>
                      <span style={{ ...styles.tag, color: freshness.color }}>
                        {freshness.label}
                      </span>
                    </div>
                    <div style={styles.cardWaypoints}>
                      🗺 {trail.waypoints?.length || 0} waypoints
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F9FAF7' },
  hero: { background: '#27500A', color: '#fff', padding: '48px 24px', textAlign: 'center' },
  heroTitle: { fontSize: '36px', margin: '0 0 8px' },
  heroSub: { fontSize: '16px', opacity: 0.8, margin: '0 0 24px' },
  heroBtn: { background: '#EAF3DE', color: '#27500A', padding: '10px 24px',
             borderRadius: '24px', textDecoration: 'none', fontWeight: '600' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  sectionTitle: { fontSize: '20px', color: '#1A1A1A', marginBottom: '16px' },
  empty: { textAlign: 'center', padding: '48px', color: '#666' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  cardLink: { textDecoration: 'none' },
  card: { background: '#fff', border: '1px solid #E0E0E0', borderRadius: '12px',
          display: 'flex', overflow: 'hidden', cursor: 'pointer' },
  cardIcon: { width: '72px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '28px', background: '#EAF3DE' },
  cardBody: { padding: '12px 16px', flex: 1 },
  cardName: { fontSize: '16px', fontWeight: '600', color: '#1A1A1A' },
  cardLoc: { fontSize: '12px', color: '#666', margin: '4px 0' },
  cardTags: { display: 'flex', gap: '8px', margin: '6px 0' },
  tag: { fontSize: '11px', background: '#EAF3DE', color: '#27500A',
         padding: '2px 8px', borderRadius: '10px' },
  cardWaypoints: { fontSize: '12px', color: '#639922' }
};

export default Home;