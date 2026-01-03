import React, { useState, useEffect } from 'react';
import './Login.css';
import { authenticateUser, initializeUsers } from '../utils/userManagement';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialiser les utilisateurs par défaut au montage
  useEffect(() => {
    initializeUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Authentifier l'utilisateur
      const user = authenticateUser(username, password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '400px' }}>
        <div className="login-header">
          <h1 style={{ fontSize: '28px', margin: '0 0 5px 0' }}>🏫 LA RÉFÉRENCE</h1>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>Système de gestion scolaire</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}

          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre identifiant"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p style={{ fontSize: '11px', opacity: 0.6 }}>© 2026 LA RÉFÉRENCE</p>
        </div>
      </div>
    </div>
  );
}
