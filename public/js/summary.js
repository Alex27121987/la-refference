// summary.js - Calcul des statistiques et résumés

const Summary = {
  // Obtenir les statistiques globales
  getGlobalStats: function() {
    const students = Forms.loadRecords('students') || [];
    
    return {
      total: students.length,
      maternelle: students.filter(s => s.section === 'maternelle').length,
      primaire: students.filter(s => s.section === 'primaire').length,
      secondaire: students.filter(s => s.section === 'secondaire').length
    };
  },

  // Obtenir les statistiques par classe
  getClassStats: function(classKey) {
    const students = Forms.loadRecords('students') || [];
    return students.filter(s => s.classKey === classKey).length;
  },

  // Obtenir les statistiques par section avec détails
  getSectionStats: function(section) {
    const students = Forms.loadRecords('students') || [];
    const sectionStudents = students.filter(s => s.section === section);
    
    // Grouper par classe
    const byClass = {};
    sectionStudents.forEach(student => {
      const classKey = student.classKey || 'unknown';
      byClass[classKey] = (byClass[classKey] || 0) + 1;
    });

    return {
      total: sectionStudents.length,
      byClass: byClass,
      students: sectionStudents
    };
  },

  // Obtenir les statistiques par sexe
  getGenderStats: function() {
    const students = Forms.loadRecords('students') || [];
    
    return {
      masculin: students.filter(s => s.sexe === 'Masculin').length,
      feminin: students.filter(s => s.sexe === 'Féminin').length,
      nonSpecifie: students.filter(s => !s.sexe || s.sexe === '').length
    };
  },

  // Obtenir les inscriptions par mois
  getInscriptionsByMonth: function() {
    const students = Forms.loadRecords('students') || [];
    const byMonth = {};

    students.forEach(student => {
      if (student.dateInscription) {
        const date = new Date(student.dateInscription);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthYear] = (byMonth[monthYear] || 0) + 1;
      }
    });

    return byMonth;
  },

  // Afficher un résumé formaté
  renderSummary: function(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = this.getGlobalStats();
    const genderStats = this.getGenderStats();

    let html = '<div class="summary-display">';
    
    // Statistiques globales
    html += `
      <div class="stat-group">
        <h3>Effectif global</h3>
        <p class="big-number">${stats.total}</p>
      </div>
    `;

    // Par section
    if (options.showSections !== false) {
      html += `
        <div class="stat-group">
          <h3>Par section</h3>
          <p>Maternelle: <strong>${stats.maternelle}</strong></p>
          <p>Primaire: <strong>${stats.primaire}</strong></p>
          <p>Secondaire: <strong>${stats.secondaire}</strong></p>
        </div>
      `;
    }

    // Par sexe
    if (options.showGender !== false) {
      html += `
        <div class="stat-group">
          <h3>Par sexe</h3>
          <p>Masculin: <strong>${genderStats.masculin}</strong></p>
          <p>Féminin: <strong>${genderStats.feminin}</strong></p>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  // Obtenir le breakdown compact (M: X | P: X | S: X)
  getCompactBreakdown: function() {
    const stats = this.getGlobalStats();
    return `M: ${stats.maternelle} | P: ${stats.primaire} | S: ${stats.secondaire}`;
  }
};

// Fonction globale pour compatibilité
function loadSummary() {
  Summary.renderSummary('summaryCards');
}
