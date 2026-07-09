import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🌿 Ghost Trail</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Explore</Link>
        <Link to="/add" style={styles.link}>Add Spot</Link>
        {user ? (
          <>
            <span style={styles.userName}>👤 {user.name}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <Link to="/auth" style={styles.loginBtn}>Sign in</Link>
        )}
        <Link to="/sos" style={styles.sosLink}>SOS</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
         padding: '12px 24px', backgroundColor: '#27500A', color: '#fff' },
  brand: { color: '#fff', textDecoration: 'none', fontSize: '20px', fontWeight: '600' },
  links: { display: 'flex', gap: '16px', alignItems: 'center' },
  link: { color: '#EAF3DE', textDecoration: 'none', fontSize: '14px' },
  sosLink: { color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', fontWeight: '600' },
  loginBtn: { color: '#27500A', background: '#EAF3DE', padding: '5px 14px',
              borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' },
  logoutBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#EAF3DE',
               padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  userName: { color: '#EAF3DE', fontSize: '13px' }
};

export default Navbar;