import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notifApi } from '../../api';
import styles from './Layout.module.css';

const NavIcon = ({ path, label, icon, badge }) => (
  <NavLink to={path} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
    <span className={styles.navIcon}>{icon}</span>
    <span className={styles.navLabel}>{label}</span>
    {badge > 0 && <span className="badge badge-dot">{badge > 9 ? '9+' : badge}</span>}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await notifApi.count(); setNotifCount(data.count); } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user ? `${user.nom[0]}${user.prenom[0]}`.toUpperCase() : '?';

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <span className={styles.logoText}>EduConnect</span>
        </div>

        <nav className={styles.nav}>
          <NavIcon path="/" label="Fil d'actualité" icon="🏠" />
          <NavIcon path="/lives" label="Lives" icon="🎥" />
          <NavIcon path="/messages" label="Messages" icon="💬" />
          <NavIcon path="/notifications" label="Notifications" icon="🔔" badge={notifCount} />
          <NavIcon path={`/profil/${user?.id}`} label="Mon profil" icon="👤" />
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userCard} onClick={() => setMenuOpen(v => !v)}>
            <div className="avatar avatar-sm">{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.prenom} {user?.nom}</span>
              <span className={styles.userEmail}>{user?.etablissement}</span>
            </div>
            <span>⋮</span>
          </div>
          {menuOpen && (
            <div className={styles.userMenu}>
              <button onClick={handleLogout} className={styles.logoutBtn}>🚪 Déconnexion</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
