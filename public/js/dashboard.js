// dashboard.js - Gestion du tableau de bord

const Dashboard = {
  // Initialisation
  init: function() {
    this.checkAuth();
    this.loadUser();
    this.loadSummary();
  },

  // Vérifier l'authentification
  checkAuth: function() {
    const user = sessionStorage.getItem('user');
    if (!user) {
      window.location.href = 'index.html';
    }
  },

  // Charger les infos utilisateur
  loadUser: function() {
    const user = sessionStorage.getItem('user');
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && user) {
      userDisplay.textContent = `Connecté en tant que : ${user}`;
    }
  },

  // Charger les statistiques
  loadSummary: function() {
    const students = Forms.loadRecords('students') || [];
    
    // Compter par section
    const stats = {
      total: students.length,
      maternelle: students.filter(s => s.section === 'maternelle').length,
      primaire: students.filter(s => s.section === 'primaire').length,
      secondaire: students.filter(s => s.section === 'secondaire').length
    };

    // Breakdown détaillé
    const breakdown = {
      M: stats.maternelle,
      P: stats.primaire,
      S: stats.secondaire
    };

    // Afficher les cartes
    this.renderSummaryCards(stats, breakdown);
  },

  // Afficher les cartes de statistiques
  renderSummaryCards: function(stats, breakdown) {
    const container = document.getElementById('summaryCards');
    if (!container) return;

    const html = `
      <div class="summary-card">
        <h3>Total</h3>
        <p class="summary-number">${stats.total}</p>
        <p style="font-size:0.52rem; margin-top:3px;">M: ${breakdown.M} | P: ${breakdown.P} | S: ${breakdown.S}</p>
      </div>
      <div class="summary-card">
        <h3>Maternelle</h3>
        <p class="summary-number">${stats.maternelle}</p>
      </div>
      <div class="summary-card">
        <h3>Primaire</h3>
        <p class="summary-number">${stats.primaire}</p>
      </div>
      <div class="summary-card">
        <h3>Secondaire</h3>
        <p class="summary-number">${stats.secondaire}</p>
      </div>
    `;

    container.innerHTML = html;
  },

  // Fonction pour obtenir le label d'une classe
  labelForClass: function(classKey) {
    const labels = {
      'maternelle-1': 'Maternelle 1',
      'maternelle-2': 'Maternelle 2',
      'maternelle-3': 'Maternelle 3',
      'primaire-1': 'Primaire 1',
      'primaire-2': 'Primaire 2',
      'primaire-3': 'Primaire 3',
      'primaire-4': 'Primaire 4',
      'primaire-5': 'Primaire 5',
      'primaire-6': 'Primaire 6',
      'secondaire-7ebe': '7ème EBE',
      'secondaire-8ebe': '8ème EBE'
    };
    return labels[classKey] || classKey;
  }
};

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
  Dashboard.init();
}
