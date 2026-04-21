import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicationApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Commentaires from './Commentaires';
import styles from './PublicationCard.module.css';

export default function PublicationCard({ publication, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(publication.texte);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.id === publication.auteur?.id;
  const initials = `${publication.auteur?.nom?.[0] || ''}${publication.auteur?.prenom?.[0] || ''}`.toUpperCase();

  const handleLike = async () => {
    try {
      const { data } = await publicationApi.liker(publication.id);
      onUpdate(data);
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette publication ?')) return;
    try {
      await publicationApi.supprimer(publication.id);
      onDelete(publication.id);
      toast.success('Publication supprimée');
    } catch {}
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const { data } = await publicationApi.modifier(publication.id, {
        texte: editText, urlImage: publication.urlImage, visibilite: publication.visibilite
      });
      onUpdate(data);
      setEditing(false);
      toast.success('Publication modifiée');
    } catch {}
    finally { setLoading(false); }
  };

  const handleResolu = async () => {
    try {
      const { data } = await publicationApi.marquerResolu(publication.id);
      onUpdate(data);
      toast.success('Marqué comme résolu');
    } catch {}
  };

  const timeAgo = publication.datePublication
    ? formatDistanceToNow(new Date(publication.datePublication), { addSuffix: true, locale: fr })
    : '';

  return (
    <div className={`card ${styles.card}`}>
      {/* Header */}
      <div className={styles.header}>
        <Link to={`/profil/${publication.auteur?.id}`}>
          <div className="avatar">{initials}</div>
        </Link>
        <div className={styles.meta}>
          <Link to={`/profil/${publication.auteur?.id}`} className={styles.authorName}>
            {publication.auteur?.prenom} {publication.auteur?.nom}
          </Link>
          <span className={styles.time}>{timeAgo} · {publication.visibilite === 'PUBLIC' ? '🌍' : '🔒'}</span>
        </div>
        {publication.resolu && <span className="badge badge-success">✓ Résolu</span>}
        {isOwner && (
          <div className={styles.ownerActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(v => !v)}>✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={handleDelete}>🗑️</button>
            {!publication.resolu && (
              <button className="btn btn-ghost btn-sm" title="Marquer résolu" onClick={handleResolu}>✓</button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className={styles.editArea}>
          <textarea className={styles.editInput} value={editText}
            onChange={e => setEditText(e.target.value)} rows={3} />
          <div className={styles.editButtons}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={handleEdit} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.texte}>{publication.texte}</p>
      )}

      {publication.urlImage && (
        <img src={publication.urlImage} alt="" className={styles.image}
          onError={e => e.target.style.display = 'none'} />
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${publication.likedByMe ? styles.liked : ''}`}
          onClick={handleLike}>
          {publication.likedByMe ? '❤️' : '🤍'} {publication.likes}
        </button>
        <button className={styles.actionBtn} onClick={() => setShowComments(v => !v)}>
          💬 {publication.nbCommentaires}
        </button>
      </div>

      {/* Commentaires */}
      {showComments && (
        <Commentaires publicationId={publication.id}
          onCountChange={(n) => onUpdate({ ...publication, nbCommentaires: n })} />
      )}
    </div>
  );
}
