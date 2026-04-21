import React, { useState, useEffect } from 'react';
import { notifApi } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './NotificationsPage.module.css';

const ICONS = { LIKE:'❤️', COMMENTAIRE:'💬', ABONNEMENT:'👤', LIVE_DEBUT:'🎥', default:'🔔' };

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifApi.getAll().then(r => setNotifs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLue = async (id) => {
    await notifApi.marquerLue(id).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
  };

  const handleToutesLues = async () => {
    await notifApi.marquerToutesLues().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
  };

  const nonLues = notifs.filter(n => !n.lue).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🔔 Notifications</h1>
          {nonLues > 0 && <span className={styles.count}>{nonLues} non lue{nonLues > 1 ? 's' : ''}</span>}
        </div>
        {nonLues > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleToutesLues}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}><div className="spinner" style={{width:32,height:32}} /></div>
      ) : notifs.length === 0 ? (
        <div className={styles.empty}><span>🔕</span><p>Aucune notification</p></div>
      ) : (
        <div className={styles.list}>
          {notifs.map(n => (
            <div key={n.id}
              className={`card ${styles.notif} ${!n.lue ? styles.unread : ''}`}
              onClick={() => !n.lue && handleLue(n.id)}>
              <span className={styles.icon}>{ICONS[n.type] || ICONS.default}</span>
              <div className={styles.content}>
                <p className={styles.message}>{n.contenu}</p>
                <span className={styles.time}>
                  {n.date ? formatDistanceToNow(new Date(n.date), { addSuffix: true, locale: fr }) : ''}
                </span>
              </div>
              {!n.lue && <div className={styles.dot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
