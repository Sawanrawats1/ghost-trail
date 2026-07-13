import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';

function MyTrails() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTrail, setEditingTrail] = useState(null); // trail object being edited, or null
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmTrail, setConfirmTrail] = useState(null); // trail pending delete confirmation
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchTrails = () => {
    axios.get('http://localhost:5000/api/trails/mine', authHeaders)
      .then(res => { setTrails(res.data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.error || 'Could not load your trails');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchTrails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

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

  const openEdit = (trail) => {
    setEditingTrail(trail);
    setEditForm({
      name: trail.name,
      location: trail.location,
      type: trail.type,
      difficulty: trail.difficulty,
      description: trail.description || ''
    });
  };

  const closeEdit = () => {
    setEditingTrail(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    if (!editForm.name?.trim() || !editForm.location?.trim()) {
      alert('Name and location cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/trails/${editingTrail._id}`,
        editForm,
        authHeaders
      );
      setTrails(trails.map(t => t._id === editingTrail._id ? res.data : t));
      closeEdit();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update trail');
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!confirmTrail) return;
    const trail = confirmTrail;
    setDeletingId(trail._id);
    setConfirmTrail(null);
    try {
      await axios.delete(`http://localhost:5000/api/trails/${trail._id}`, authHeaders);
      setTrails(trails.filter(t => t._id !== trail._id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete trail');
    }
    setDeletingId(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Trails</h1>
        <p style={styles.subtitle}>
          {user ? `Spots contributed by ${user.name}` : 'Your contributed spots'}
        </p>
      </div>

      <div style={styles.listWrap}>
        {loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🌿</div>
            <p>Loading...</p>
          </div>
        )}

        {!loading && error && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚠</div>
            <div style={styles.emptyTitle}>{error}</div>
          </div>
        )}

        {!loading && !error && trails.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🗺</div>
            <div style={styles.emptyTitle}>You haven't added any trails yet</div>
            <div style={styles.emptyText}>Share a hidden spot to see it here</div>
            <Link to="/add" style={styles.emptyBtn}>+ Share a spot</Link>
          </div>
        )}

        {!loading && !error && trails.map(trail => {
          const freshness = getFreshness(trail.lastConfirmedDate);
          const days = Math.floor((new Date() - new Date(trail.lastConfirmedDate)) / (1000 * 60 * 60 * 24));
          return (
            <div style={styles.card} key={trail._id}>
              <Link to={`/trail/${trail._id}`} style={styles.cardLink}>
                <div style={styles.cardMain}>
                  <div style={styles.cardIcon}>{getIcon(trail.type)}</div>
                  <div style={styles.cardBody}>
                    <div style={styles.cardName}>{trail.name}</div>
                    <div style={styles.cardLoc}>📍 {trail.location}</div>
                    <div style={styles.cardTags}>
                      <span style={styles.tagDiff}>{trail.difficulty}</span>
                      <span style={styles.tagType}>{trail.type}</span>
                      <span style={{ ...styles.tagFresh, background: freshness.bg, color: freshness.color }}>
                        {freshness.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <div style={styles.cardStrip}>
                <span>🗺 {trail.waypoints?.length || 0} waypoints</span>
                <span>·</span>
                <span style={{ color: freshness.color }}>
                  {days === 0 ? 'Today' : `${days}d ago`}
                </span>
                {trail.comments?.length > 0 && (<><span>·</span><span>💬 {trail.comments.length}</span></>)}
              </div>
              <div style={styles.actionRow}>
                <button style={styles.editBtn} onClick={() => openEdit(trail)}>✎ Edit</button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => setConfirmTrail(trail)}
                  disabled={deletingId === trail._id}
                >
                  {deletingId === trail._id ? 'Deleting...' : '🗑 Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editingTrail && (
        <div style={styles.modalOverlay} onClick={closeEdit}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Edit trail</h3>

            <label style={styles.label}>Spot name</label>
            <input style={styles.input} name="name" value={editForm.name} onChange={handleEditChange} />

            <label style={styles.label}>Location</label>
            <input style={styles.input} name="location" value={editForm.location} onChange={handleEditChange} />

            <label style={styles.label}>Type</label>
            <select style={styles.input} name="type" value={editForm.type} onChange={handleEditChange}>
              <option value="waterfall">Waterfall</option>
              <option value="lake">Lake</option>
              <option value="cave">Cave</option>
              <option value="meadow">Meadow</option>
              <option value="river">River pool</option>
              <option value="summit">Summit</option>
              <option value="other">Other</option>
            </select>

            <label style={styles.label}>Difficulty</label>
            <select style={styles.input} name="difficulty" value={editForm.difficulty} onChange={handleEditChange}>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>

            <label style={styles.label}>Description</label>
            <textarea style={styles.textarea} name="description" value={editForm.description} onChange={handleEditChange} />

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={closeEdit} disabled={saving}>Cancel</button>
              <button style={styles.saveBtn} onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom delete confirmation modal — replaces the plain browser confirm() popup */}
      {confirmTrail && (
        <div style={styles.modalOverlay} onClick={() => setConfirmTrail(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div style={styles.confirmIcon}>🗑</div>
            <h3 style={styles.confirmTitle}>Delete this trail?</h3>
            <p style={styles.confirmText}>
              "<strong>{confirmTrail.name}</strong>" will be permanently removed, along with its
              waypoints and visitor comments. This cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setConfirmTrail(null)}>Cancel</button>
              <button style={styles.confirmDeleteBtn} onClick={confirmDelete}>Yes, delete it</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.bottomNav}>
        <button style={styles.bottomBtn} onClick={() => navigate('/')}>
          <span style={styles.bottomIcon}>🧭</span>
          <span style={styles.bottomLabel}>Explore</span>
        </button>
        <button style={styles.bottomBtn} onClick={() => navigate('/add')}>
          <span style={styles.bottomIcon}>📍</span>
          <span style={styles.bottomLabel}>Leave a Path</span>
        </button>
        <button style={{ ...styles.bottomBtn, color: '#27500A', fontWeight: '700' }} onClick={() => navigate('/my-trails')}>
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
  page: { background: '#F4F6F1', minHeight: '100vh', fontFamily: 'Arial, sans-serif', paddingBottom: '70px' },
  header: { padding: '24px 16px 12px', background: '#fff', borderBottom: '1px solid #EEF0EA' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#777', margin: 0 },
  listWrap: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardLink: { textDecoration: 'none', display: 'block' },
  card: { background: '#fff', border: '1px solid #E4E8DF', borderRadius: '14px', overflow: 'hidden' },
  cardMain: { display: 'flex', alignItems: 'stretch' },
  cardIcon: { width: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', background: '#EAF3DE', flexShrink: 0 },
  cardBody: { padding: '11px 14px', flex: 1 },
  cardName: { fontSize: '15px', fontWeight: '600', color: '#1A1A1A' },
  cardLoc: { fontSize: '12px', color: '#777', margin: '3px 0 7px' },
  cardTags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tagDiff: { fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: '#F0F0F0', color: '#555' },
  tagType: { fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: '#E6F1FB', color: '#185FA5' },
  tagFresh: { fontSize: '10px', padding: '2px 8px', borderRadius: '10px' },
  cardStrip: { display: 'flex', gap: '8px', alignItems: 'center', padding: '7px 14px',
               background: '#F8FAF6', borderTop: '1px solid #EEF0EA',
               fontSize: '11px', color: '#777', flexWrap: 'wrap' },
  actionRow: { display: 'flex', gap: '8px', padding: '8px 14px 12px', borderTop: '1px solid #EEF0EA' },
  editBtn: { flex: 1, padding: '8px', fontSize: '12px', fontWeight: '500', borderRadius: '8px',
             border: '1px solid #27500A', background: '#EAF3DE', color: '#27500A', cursor: 'pointer' },
  deleteBtn: { flex: 1, padding: '8px', fontSize: '12px', fontWeight: '500', borderRadius: '8px',
               border: '1px solid #E8B4B4', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' },
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
  bottomLabel: { fontSize: '10px', fontWeight: '500' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 200, padding: '20px' },
  modal: { background: '#fff', borderRadius: '14px', padding: '20px', width: '100%',
           maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: '17px', fontWeight: '600', color: '#1A1A1A', marginBottom: '14px' },
  label: { fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
           borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #ddd',
              borderRadius: '8px', marginBottom: '12px', minHeight: '70px',
              resize: 'vertical', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '6px' },
  cancelBtn: { flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px',
               border: '1px solid #ddd', background: '#fff', color: '#444', cursor: 'pointer' },
  saveBtn: { flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px',
             border: 'none', background: '#27500A', color: '#fff', fontWeight: '500', cursor: 'pointer' },
  confirmModal: { background: '#fff', borderRadius: '16px', padding: '24px', width: '100%',
                  maxWidth: '360px', textAlign: 'center' },
  confirmIcon: { fontSize: '32px', marginBottom: '10px' },
  confirmTitle: { fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
  confirmText: { fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '18px' },
  confirmDeleteBtn: { flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px',
                      border: 'none', background: '#A32D2D', color: '#fff', fontWeight: '500', cursor: 'pointer' }
};

export default MyTrails;