import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveApi } from '../api';
import { toast } from 'react-toastify';
import styles from './LivesPage.module.css';

export default function LivesPage() {
  const navigate = useNavigate();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [titre, setTitre] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    liveApi.getLivesActifs().then(r => setLives(r.data)).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!titre.trim()) return;
    setCreating(true);
    try {
      const { data } = await liveApi.creer({ titre });
      const { data: started } = await liveApi.demarrer(data.id);
      toast.success('Live démarré !');
      navigate(`/lives/${started.id}`);
    } catch { toast.error('Erreur lors de la création du live'); }
    finally { setCreating(false); }
  };

  const handleJoin = async (liveId) => {
    try {
      await liveApi.rejoindre(liveId);
      navigate(`/lives/${liveId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de rejoindre le live');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🎥 Lives</h1>
          <p className={styles.subtitle}>Sessions collaboratives en direct</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
          + Démarrer un live
        </button>
      </div>

      {showCreate && (
        <div className={`card ${styles.createCard}`}>
          <h3 className={styles.createTitle}>Créer un live</h3>
          <form onSubmit={handleCreate} className={styles.createForm}>
            <input className="input" placeholder="Titre du live (ex: Cours de maths, TP Python...)"
              value={titre} onChange={e => setTitre(e.target.value)} required />
            <div className={styles.createActions}>
              <button type="button" className="btn btn-secondary"
                onClick={() => setShowCreate(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <span className="spinner" /> : '🎥 Lancer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}><div className="spinner" style={{width:32,height:32}} /></div>
      ) : lives.length === 0 ? (
        <div className={styles.empty}>
          <span>📡</span>
          <p>Aucun live en cours</p>
          <small>Soyez le premier à démarrer une session !</small>
        </div>
      ) : (
        <div className={styles.grid}>
          {lives.map(live => (
            <div key={live.id} className={`card ${styles.liveCard}`}>
              <div className={styles.liveHeader}>
                <span className={styles.liveBadge}>🔴 EN DIRECT</span>
                <span className={styles.participants}>
                  👥 {live.participants?.length || 0}
                </span>
              </div>
              <h3 className={styles.liveTitle}>{live.titre}</h3>
              <div className={styles.liveCreateur}>
                <div className="avatar avatar-sm">
                  {live.createur?.nom?.[0]}{live.createur?.prenom?.[0]}
                </div>
                <span>{live.createur?.prenom} {live.createur?.nom}</span>
              </div>
              <button className="btn btn-primary w-full" onClick={() => handleJoin(live.id)}>
                Rejoindre
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
