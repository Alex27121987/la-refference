// login.js - Gestion de la connexion

const LoginManager = {
  // Credentials (à remplacer par une vraie authentification en production)
  credentials: {
    'Alex': 'cvbc',
    'user': 'user123',
    'secretaire': 'secret123',
    'directeur': 'dir123'
  },

  // Initialisation
  init: function() {
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', this.handleLogin.bind(this));
    }
  },

  // Gestion de la connexion
  handleLogin: function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    if (!username || !password) {
      this.showError('Veuillez remplir tous les champs');
      return;
    }

    if (this.credentials[username] && this.credentials[username] === password) {
      // Connexion réussie
      sessionStorage.setItem('user', username);
      sessionStorage.setItem('loginTime', new Date().toISOString());
      
      // Redirection
      window.location.href = 'dashboard.html';
    } else {
      this.showError('Nom d\'utilisateur ou mot de passe incorrect');
    }
  },

  // Afficher une erreur
  showError: function(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      
      // Masquer après 3 secondes
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 3000);
    }
  }
};

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LoginManager.init());
} else {
  LoginManager.init();
}
