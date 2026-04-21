import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { etudiantApi, publicationApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import PublicationCard from '../components/feed/PublicationCard';
import { toast } from 'react-toastify';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [publications, setPublications] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [suivi, setSuivi] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMe = user?.id === parseInt(id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, pubs, abons] = await Promise.all([
          etudiantApi.getProfil(id),
          publicationApi.getByEtudiant(id, user?.id),
          etudiantApi.getAbonnements(),
        ]);
        setProfil(p.data);
        setPublications(pubs.data.content || []);
        setSuivi(abons.data.some(a => a.id === parseInt(id)));
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  const handleSuivre = async () => {
    try {
      if (suivi) {
        await etudiantApi.seDesabonner(id);
        setSuivi(false);
        toast.success('Désabonné');
      } else {
        await etudiantApi.suivre(id);
        setSuivi(true);
        toast.success('Abonnement effectué');
      }
    } catch {}
  };

  if (loading) return <div className={styles.loading}><div className="spinner" style={{width:32,height:32}} /></div>;
  if (!profil) return <div className={styles.loading}>Profil introuvable</div>;

  const initials = `${profil.nom[0]}${profil.prenom[0]}`.toUpperCase();

  return (
    <div className={styles.page}>
      <div className={`card ${styles.profileCard}`}>
        <div className={styles.cover} />
        <div className={styles.profileBody}>
          <div className="avatar avatar-lg" style={{fontSize:24}}>{initials}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.name}>{profil.prenom} {profil.nom}</h2>
            {profil.etablissement && <p className={styles.etab}>🏛 {profil.etablissement}</p>}
            {profil.pays && <p className={styles.pays}>📍 {profil.pays}</p>}
            {profil.hobby && <p className={styles.hobby}>🎯 {profil.hobby}</p>}
          </div>
          {!isMe && (
            <button className={`btn ${suivi ? 'btn-secondary' : 'btn-primary'}`} onClick={handleSuivre}>
              {suivi ? '✓ Abonné' : '+ Suivre'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.publications}>
        <h3 className={styles.sectionTitle}>Publications ({publications.length})</h3>
        {publications.length === 0 ? (
          <div className={styles.empty}><span>📝</span><p>Aucune publication</p></div>
        ) : (
          publications.map(pub => (
            <PublicationCard key={pub.id} publication={pub}
              onUpdate={p => setPublications(prev => prev.map(x => x.id === p.id ? p : x))}
              onDelete={pid => setPublications(prev => prev.filter(x => x.id !== pid))} />
          ))
        )}
      </div>
    </div>
  );
}
