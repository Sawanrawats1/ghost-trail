import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🌿 Ghost Trail</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Explore</Link>
        <Link to="/add" style={styles.link}>Add Spot</Link>
        <Link to="/sos" style={styles.sosLink}>SOS</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display:'flex', justifyContent:'space-between', alignItems:'center',
         padding:'12px 24px', backgroundColor:'#27500A', color:'#fff' },
  brand: { color:'#fff', textDecoration:'none', fontSize:'20px', fontWeight:'600' },
  links: { display:'flex', gap:'20px' },
  link: { color:'#EAF3DE', textDecoration:'none', fontSize:'14px' },
  sosLink: { color:'#FF6B6B', textDecoration:'none', fontSize:'14px', fontWeight:'600' }
};

export default Navbar;