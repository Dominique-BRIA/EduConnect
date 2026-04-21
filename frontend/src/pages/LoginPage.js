import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🎓</span>
          <h1 className={styles.title}>EduConnect</h1>
          <p className={styles.subtitle}>Connectez-vous à votre espace</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input className="input" type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label>Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.motDePasse} onChange={e => setForm(f => ({ ...f, motDePasse: e.target.value }))} required />
          </div>
          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Se connecter'}
          </button>
        </form>
        <p className={styles.footer}>
          Pas de compte ? <Link to="/register" className={styles.link}>S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
