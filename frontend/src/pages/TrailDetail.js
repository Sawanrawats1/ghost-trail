import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../AuthContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function TrailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  const [commentResult, setCommentResult] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/trails/${id}`)
      .then(res => { setTrail(res.data); setLoading(false); })
      .catch(err => { console.log(err); setLoading(false); });
  }, [id]);

  const confirmFresh = async () => {
    await axios.put(`http://localhost:5000/api/trails/${id}/confirm`);
    setConfirmed(true);
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    if (!user) { navigate('/auth'); return; }
    setSubmittingComment(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/trails/${id}/comments`,
        { text: comment, author: user.name }
      );
      setCommentResult(res.data.nlpResult);
      setComment('');
      const updated = await axios.get(`http://localhost:5000/api/trails/${id}`);
      setTrail(updated.data);
    } catch (err) { console.log(err); }
    setSubmittingComment(false);
  };

  const getFreshness = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days > 180) return { label: '⚠ Needs review — path may have changed', color: '#A32D2D', bg: '#FCEBEB' };
    if (days > 90) return { label: '⚡ May have changed — confirm if you visit', color: '#BA7517', bg: '#FAEEDA' };
    return { label: '✓ Fresh — recently confirmed', color: '#27500A', bg: '#EAF3DE' };
  };

  if (loading) return <div style={styles.loading}>Loading trail...</div>;
  if (!trail) return <div style={styles.loading}>Trail not found.</div>;

  const freshness = getFreshness(trail.lastConfirmedDate);
  const firstWpWithCoords = trail.waypoints?.find(wp => wp.lat && wp.lng);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <div style={styles.heroIcon}>
          {trail.type === 'waterfall' ? '🌊' :
           trail.type === 'lake' ? '🏔' :
           trail.type === 'cave' ? '🕳' :
           trail.type === 'meadow' ? '🌿' : '📍'}
        </div>
      </div>

      <div style={styles.container}>
        <h1 style={styles.name}>{trail.name}</h1>
        <div style={styles.loc}>📍 {trail.location}</div>

        <div style={styles.tags}>
          <span style={styles.tag}>{trail.difficulty}</span>
          <span style={styles.tag}>{trail.type}</span>
          <span style={{ ...styles.tag, background: freshness.bg, color: freshness.color }}>
            {freshness.label}
          </span>
        </div>

        {/* Contributor card */}
        {trail.createdBy && (
          <div style={styles.contributorCard}>
            <div style={styles.contributorAvatar}>
              {trail.createdBy.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.contributorName}>🧭 {trail.createdBy}</div>
              <div style={styles.contributorLabel}>Submitted this trail · Trailblazer</div>
            </div>
          </div>
        )}

        {firstWpWithCoords && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>🗺 Trail location map</div>
            <MapContainer
              center={[firstWpWithCoords.lat, firstWpWithCoords.lng]}
              zoom={13}
              style={{ height: '220px', borderRadius: '8px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {trail.waypoints.map((wp, i) =>
                wp.lat && wp.lng ? (
                  <Marker key={i} position={[wp.lat, wp.lng]}>
                    <Popup>
                      <strong>{wp.title}</strong><br />{wp.description}
                    </Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
          </div>
        )}

        {trail.story && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>📖 Story</div>
            <p style={styles.storyText}>{trail.story}</p>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.cardTitle}>🧭 Trail path — follow these steps</div>
          {trail.waypoints?.sort((a, b) => a.order - b.order).map((wp, i) => (
            <div key={i} style={styles.wpRow}>
              <div style={styles.wpNum}>{i === 0 ? 'S' : wp.order}</div>
              <div style={styles.wpBody}>
                <div style={styles.wpTitle}>{wp.title}</div>
                <div style={styles.wpDesc}>{wp.description}</div>
              </div>
            </div>
          ))}
        </div>

        {trail.challenges && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>⚠ Challenges & warnings</div>
            <p style={styles.challengeText}>{trail.challenges}</p>
          </div>
        )}

        <div style={{ ...styles.card, background: freshness.bg, border: `1px solid ${freshness.color}` }}>
          <div style={styles.cardTitle}>🔄 Trail freshness</div>
          <p style={{ fontSize: '13px', color: '#444', marginBottom: '12px' }}>
            Last confirmed: {new Date(trail.lastConfirmedDate).toLocaleDateString()}
          </p>
          {confirmed ? (
            <div style={{ color: '#27500A', fontWeight: '600' }}>
              ✓ Thank you for confirming this trail is still accurate!
            </div>
          ) : (
            <button style={styles.confirmBtn} onClick={confirmFresh}>
              ✓ I visited — trail is still accurate
            </button>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>💬 Leave a comment — help future visitors</div>
          {!user && (
            <div style={styles.signInPrompt}>
              <span>Sign in to leave a comment</span>
              <button style={styles.signInBtn} onClick={() => navigate('/auth')}>Sign in</button>
            </div>
          )}
          {user && (
            <>
              <div style={styles.commentingAs}>
                Commenting as <strong>{user.name}</strong>
              </div>
              <textarea
                style={styles.textarea}
                placeholder="How was the trail? Any changes, hazards, or tips for the next visitor..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <button style={styles.confirmBtn} onClick={submitComment} disabled={submittingComment}>
                {submittingComment ? 'Analyzing...' : 'Submit comment'}
              </button>
            </>
          )}

          {commentResult && (
            <div style={{
              marginTop: '12px', padding: '12px', borderRadius: '8px', fontSize: '13px',
              background: commentResult.risk === 'needs_review' ? '#FCEBEB' :
                          commentResult.risk === 'caution' ? '#FAEEDA' : '#EAF3DE',
              color: commentResult.risk === 'needs_review' ? '#A32D2D' :
                     commentResult.risk === 'caution' ? '#854F0B' : '#27500A'
            }}>
              <strong>🤖 NLP Analysis:</strong> {commentResult.risk.replace('_', ' ')}
              {' '}(confidence: {Math.round(commentResult.confidence * 100)}%)
              {commentResult.hazard_keywords_found?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  ⚠ Hazard words detected: <strong>{commentResult.hazard_keywords_found.join(', ')}</strong>
                </div>
              )}
            </div>
          )}

          {trail.comments?.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#1A1A1A' }}>
                Previous comments ({trail.comments.length}):
              </div>
              {trail.comments.slice().reverse().map((c, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ fontSize: '13px', color: '#1A1A1A' }}>{c.text}</div>
                  <div style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '500', color: '#639922' }}>👤 {c.author}</span>
                    <span>{new Date(c.date).toLocaleDateString()}</span>
                    <span style={{
                      color: c.nlpRisk === 'needs_review' ? '#A32D2D' :
                             c.nlpRisk === 'caution' ? '#BA7517' : '#27500A',
                      fontWeight: '500'
                    }}>
                      {c.nlpRisk?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button style={styles.followBtn} onClick={() => navigate(`/follow/${id}`)}>
          🧭 Follow this trail
        </button>

        <button style={styles.sosBtn} onClick={() => navigate('/sos')}>
          🆘 I'm lost / Need help
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#F9FAF7', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  loading: { padding: '40px', textAlign: 'center', color: '#666' },
  hero: { background: '#27500A', height: '140px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative' },
  backBtn: { position: 'absolute', top: '12px', left: '16px', background: 'rgba(255,255,255,0.9)',
             border: 'none', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer',
             fontSize: '13px', color: '#27500A' },
  heroIcon: { fontSize: '56px' },
  container: { maxWidth: '680px', margin: '0 auto', padding: '20px 16px' },
  name: { fontSize: '22px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 4px' },
  loc: { fontSize: '13px', color: '#666', marginBottom: '12px' },
  tags: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  tag: { fontSize: '11px', background: '#EAF3DE', color: '#27500A',
         padding: '3px 10px', borderRadius: '12px' },
  contributorCard: { display: 'flex', alignItems: 'center', gap: '12px',
                     background: '#EAF3DE', border: '1px solid #C0DD97',
                     borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' },
  contributorAvatar: { width: '40px', height: '40px', borderRadius: '50%',
                       background: '#27500A', color: '#fff', display: 'flex',
                       alignItems: 'center', justifyContent: 'center',
                       fontSize: '18px', fontWeight: '600', flexShrink: 0 },
  contributorName: { fontSize: '14px', fontWeight: '600', color: '#27500A' },
  contributorLabel: { fontSize: '11px', color: '#639922', marginTop: '2px' },
  card: { background: '#fff', border: '1px solid #E0E0E0', borderRadius: '12px',
          padding: '16px', marginBottom: '14px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' },
  storyText: { fontSize: '14px', color: '#444', lineHeight: '1.7', margin: 0,
               fontStyle: 'italic', borderLeft: '3px solid #639922', paddingLeft: '12px' },
  wpRow: { display: 'flex', gap: '12px', alignItems: 'flex-start',
           padding: '10px 0', borderBottom: '1px solid #F0F0F0' },
  wpNum: { width: '26px', height: '26px', borderRadius: '50%', background: '#EAF3DE',
           color: '#27500A', fontSize: '11px', fontWeight: '600', display: 'flex',
           alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' },
  wpBody: { flex: 1 },
  wpTitle: { fontSize: '14px', fontWeight: '500', color: '#1A1A1A' },
  wpDesc: { fontSize: '13px', color: '#555', marginTop: '3px', lineHeight: '1.5' },
  challengeText: { fontSize: '13px', color: '#444', lineHeight: '1.6', margin: 0 },
  confirmBtn: { background: '#27500A', color: '#fff', border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontSize: '13px', cursor: 'pointer' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
              borderRadius: '8px', marginBottom: '10px', minHeight: '80px',
              resize: 'vertical', boxSizing: 'border-box' },
  signInPrompt: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#F9FAF7', border: '1px solid #E0E0E0', borderRadius: '8px',
                  padding: '12px 14px', marginBottom: '10px', fontSize: '13px', color: '#666' },
  signInBtn: { background: '#27500A', color: '#fff', border: 'none', borderRadius: '6px',
               padding: '6px 14px', fontSize: '12px', cursor: 'pointer' },
  commentingAs: { fontSize: '12px', color: '#639922', marginBottom: '8px', fontWeight: '500' },
  followBtn: { width: '100%', padding: '14px', background: '#639922', border: 'none',
               borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600',
               cursor: 'pointer', marginTop: '4px', marginBottom: '8px' },
  sosBtn: { width: '100%', padding: '14px', background: '#A32D2D', border: 'none',
            borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600',
            cursor: 'pointer', marginTop: '4px' }
};

export default TrailDetail;