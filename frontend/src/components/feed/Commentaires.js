import React, { useState, useEffect } from 'react';
import { publicationApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './Commentaires.module.css';

export default function Commentaires({ publicationId, onCountChange }) {
  const { user } = useAuth();
  const [commentaires, setCommentaires] = useState([]);
  const [texte, setTexte] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicationApi.getCommentaires(publicationId).then(r => setCommentaires(r.data)).catch(() => {});
  }, [publicationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!texte.trim()) return;
    setLoading(true);
    try {
      const { data } = await publicationApi.commenter(publicationId, { texte });
      setCommentaires(prev => [...prev, data]);
      onCountChange(commentaires.length + 1);
      setTexte('');
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await publicationApi.supprimerCommentaire(id);
      const updated = commentaires.filter(c => c.id !== id);
      setCommentaires(updated);
      onCountChange(updated.length);
    } catch {}
  };

  const initials = user ? `${user.nom[0]}${user.prenom[0]}`.toUpperCase() : '?';

  return (
    <div className={styles.wrap}>
      {commentaires.map(c => (
        <div key={c.id} className={styles.commentaire}>
          <div className="avatar avatar-sm">
            {c.auteur?.nom?.[0]}{c.auteur?.prenom?.[0]}
          </div>
          <div className={styles.bubble}>
            <div className={styles.bubbleHeader}>
              <span className={styles.name}>{c.auteur?.prenom} {c.auteur?.nom}</span>
              <span className={styles.time}>
                {formatDistanceToNow(new Date(c.dateCreation), { addSuffix: true, locale: fr })}
              </span>
              {user?.id === c.auteur?.id && (
                <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>🗑️</button>
              )}
            </div>
            <p className={styles.texte}>{c.texte}</p>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="avatar avatar-sm">{initials}</div>
        <input className={`input ${styles.input}`} placeholder="Écrire un commentaire..."
          value={texte} onChange={e => setTexte(e.target.value)} />
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !texte.trim()}>
          {loading ? <span className="spinner" /> : '↵'}
        </button>
      </form>
    </div>
  );
}
