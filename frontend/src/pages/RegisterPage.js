import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom:'', prenom:'', email:'', motDePasse:'', etablissement:'', pays:'' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/');
      toast.success('Bienvenue sur EduConnect !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 480 }}>
        <div className={styles.header}>
          <span className={styles.logo}>🎓</span>
          <h1 className={styles.title}>Créer un compte</h1>
          <p className={styles.subtitle}>Rejoignez la communauté EduConnect</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Nom</label>
              <input className="input" placeholder="Dupont" value={form.nom} onChange={set('nom')} required />
            </div>
            <div className={styles.field}>
              <label>Prénom</label>
              <input className="input" placeholder="Marie" value={form.prenom} onChange={set('prenom')} required />
            </div>
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input className="input" type="email" placeholder="votre@email.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className={styles.field}>
            <label>Mot de passe (min. 6 caractères)</label>
            <input className="input" type="password" placeholder="••••••••" value={form.motDePasse} onChange={set('motDePasse')} required minLength={6} />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Établissement</label>
              <input className="input" placeholder="Université de Paris" value={form.etablissement} onChange={set('etablissement')} />
            </div>
            <div className={styles.field}>
              <label>Pays</label>
              <input className="input" placeholder="France" value={form.pays} onChange={set('pays')} />
            </div>
          </div>
          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Créer mon compte'}
          </button>
        </form>
        <p className={styles.footer}>
          Déjà un compte ? <Link to="/login" className={styles.link}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
