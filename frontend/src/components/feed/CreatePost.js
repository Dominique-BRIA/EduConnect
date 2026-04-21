import React, { useState } from 'react';
import { publicationApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import styles from './CreatePost.module.css';

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [texte, setTexte] = useState('');
  const [urlImage, setUrlImage] = useState('');
  const [visibilite, setVisibilite] = useState('PUBLIC');
  const [showImage, setShowImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!texte.trim()) return;
    setLoading(true);
    try {
      const { data } = await publicationApi.creer({ texte, urlImage: urlImage || null, visibilite });
      onCreated(data);
      setTexte('');
      setUrlImage('');
      setShowImage(false);
      toast.success('Publication créée');
    } catch { toast.error('Erreur lors de la publication'); }
    finally { setLoading(false); }
  };

  const initials = user ? `${user.nom[0]}${user.prenom[0]}`.toUpperCase() : '?';

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.top}>
        <div className="avatar">{initials}</div>
        <textarea
          className={styles.textarea}
          placeholder="Partagez quelque chose avec la communauté..."
          value={texte}
          onChange={e => setTexte(e.target.value)}
          rows={texte.split('\n').length > 2 ? texte.split('\n').length + 1 : 2}
        />
      </div>

      {showImage && (
        <input className={`input ${styles.imageInput}`} placeholder="URL de l'image..."
          value={urlImage} onChange={e => setUrlImage(e.target.value)} />
      )}

      {urlImage && (
        <img src={urlImage} alt="preview" className={styles.preview}
          onError={e => e.target.style.display = 'none'} />
      )}

      <div className={styles.actions}>
        <div className={styles.tools}>
          <button className={`btn btn-ghost btn-sm ${showImage ? styles.activeBtn : ''}`}
            type="button" onClick={() => setShowImage(v => !v)}>
            🖼 Image
          </button>
          <select className={styles.select} value={visibilite}
            onChange={e => setVisibilite(e.target.value)}>
            <option value="PUBLIC">🌍 Public</option>
            <option value="PRIVE">🔒 Privé</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSubmit}
          disabled={loading || !texte.trim()}>
          {loading ? <span className="spinner" /> : 'Publier'}
        </button>
      </div>
    </div>
  );
}
