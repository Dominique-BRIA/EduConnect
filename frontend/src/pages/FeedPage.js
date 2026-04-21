import React, { useState, useEffect, useCallback } from 'react';
import { publicationApi, etudiantApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import PublicationCard from '../components/feed/PublicationCard';
import CreatePost from '../components/feed/CreatePost';
import styles from './FeedPage.module.css';

export default function FeedPage() {
  const { user } = useAuth();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  const loadFeed = useCallback(async (p = 0) => {
    try {
      const { data } = await publicationApi.getFil(p);
      if (p === 0) setPublications(data.content);
      else setPublications(prev => [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage(p);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFeed(0); }, [loadFeed]);

  useEffect(() => {
    etudiantApi.search('').then(r => {
      setSuggestions(r.data.filter(e => e.id !== user?.id).slice(0, 5));
    }).catch(() => {});
  }, [user]);

  const handleNew = (pub) => setPublications(prev => [pub, ...prev]);
  const handleUpdate = (pub) => setPublications(prev => prev.map(p => p.id === pub.id ? pub : p));
  const handleDelete = (id) => setPublications(prev => prev.filter(p => p.id !== id));

  const handleSuivre = async (id) => {
    try {
      await etudiantApi.suivre(id);
      setSuggestions(prev => prev.filter(e => e.id !== id));
      toast.success('Abonnement effectué');
    } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.feed}>
        <CreatePost onCreated={handleNew} />
        {loading ? (
          <div className={styles.loadingWrap}><div className="spinner" style={{width:32,height:32}} /></div>
        ) : publications.length === 0 ? (
          <div className={styles.empty}>
            <span>📭</span>
            <p>Aucune publication pour le moment</p>
            <small>Abonnez-vous à des étudiants pour voir leurs publications</small>
          </div>
        ) : (
          <>
            {publications.map(pub => (
              <PublicationCard key={pub.id} publication={pub}
                onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
            {hasMore && (
              <button className={`btn btn-secondary w-full ${styles.loadMore}`}
                onClick={() => loadFeed(page + 1)}>
                Charger plus
              </button>
            )}
          </>
        )}
      </div>

      {/* Suggestions sidebar */}
      <aside className={styles.aside}>
        {suggestions.length > 0 && (
          <div className="card p-4">
            <h3 className={styles.asideTitle}>💡 Suggestions</h3>
            <div className={styles.suggestions}>
              {suggestions.map(e => (
                <div key={e.id} className={styles.suggestion}>
                  <div className="avatar avatar-sm">
                    {e.nom[0]}{e.prenom[0]}
                  </div>
                  <div className={styles.suggInfo}>
                    <span className={styles.suggName}>{e.prenom} {e.nom}</span>
                    <span className={styles.suggEtab}>{e.etablissement}</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleSuivre(e.id)}>
                    Suivre
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
