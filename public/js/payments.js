// payments.js - Gestion des paiements

const Payments = {
  // Structure des mois
  months: [
    { key: 'sept', label: 'Septembre' },
    { key: 'oct', label: 'Octobre' },
    { key: 'nov', label: 'Novembre' },
    { key: 'dec', label: 'Décembre' },
    { key: 'jan', label: 'Janvier' },
    { key: 'fev', label: 'Février' },
    { key: 'mars', label: 'Mars' },
    { key: 'avr', label: 'Avril' },
    { key: 'mai', label: 'Mai' },
    { key: 'juin', label: 'Juin' }
  ],

  // Charger les paiements d'un élève
  loadPayments: function(studentId) {
    const key = 'cs_la_reference_payments';
    const data = localStorage.getItem(key);
    if (!data) return {};

    try {
      const allPayments = JSON.parse(data);
      return allPayments[studentId] || {};
    } catch (e) {
      console.error('Error loading payments:', e);
      return {};
    }
  },

  // Sauvegarder un paiement
  savePayment: function(studentId, month, amount, date) {
    const key = 'cs_la_reference_payments';
    let allPayments = {};

    // Charger les paiements existants
    const data = localStorage.getItem(key);
    if (data) {
      try {
        allPayments = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing payments:', e);
      }
    }

    // Initialiser les paiements de l'élève si nécessaire
    if (!allPayments[studentId]) {
      allPayments[studentId] = {};
    }

    // Sauvegarder le paiement
    allPayments[studentId][month] = {
      amount: parseFloat(amount) || 0,
      date: date || '',
      timestamp: new Date().toISOString()
    };

    // Sauvegarder dans localStorage
    try {
      localStorage.setItem(key, JSON.stringify(allPayments));
      return true;
    } catch (e) {
      console.error('Error saving payment:', e);
      return false;
    }
  },

  // Supprimer un paiement
  deletePayment: function(studentId, month) {
    const key = 'cs_la_reference_payments';
    const data = localStorage.getItem(key);
    if (!data) return false;

    try {
      const allPayments = JSON.parse(data);
      if (allPayments[studentId] && allPayments[studentId][month]) {
        delete allPayments[studentId][month];
        localStorage.setItem(key, JSON.stringify(allPayments));
        return true;
      }
    } catch (e) {
      console.error('Error deleting payment:', e);
    }

    return false;
  },

  // Calculer le total des paiements d'un élève
  getTotalPayments: function(studentId) {
    const payments = this.loadPayments(studentId);
    let total = 0;

    Object.values(payments).forEach(payment => {
      if (payment && payment.amount) {
        total += parseFloat(payment.amount);
      }
    });

    return total;
  },

  // Obtenir les statistiques de paiement pour une classe
  getClassPaymentStats: function(classKey) {
    const students = Forms.getClassRecords('students', classKey);
    let totalExpected = 0;
    let totalReceived = 0;
    let totalStudents = students.length;

    students.forEach(student => {
      const payments = this.loadPayments(student.id);
      Object.values(payments).forEach(payment => {
        if (payment && payment.amount) {
          totalReceived += parseFloat(payment.amount);
        }
      });
    });

    return {
      totalStudents: totalStudents,
      totalReceived: totalReceived,
      averagePerStudent: totalStudents > 0 ? totalReceived / totalStudents : 0
    };
  },

  // Formater un montant avec date pour affichage
  formatPaymentCell: function(payment) {
    if (!payment || !payment.amount) {
      return '<span style="color:#999;">-</span>';
    }

    const date = payment.date || '';
    const amount = parseFloat(payment.amount).toFixed(2);

    return `
      <div style="text-align:center;">
        <div style="font-size:0.45rem; color:#666; margin-bottom:1px;">${date}</div>
        <div style="font-size:0.65rem; font-weight:bold; color:#000;">${amount} $</div>
      </div>
    `;
  },

  // Charger la configuration des frais
  loadFeesConfig: function() {
    const key = 'cs_la_reference_configFees';
    const data = localStorage.getItem(key);
    if (!data) return this.getDefaultFeesConfig();

    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading fees config:', e);
      return this.getDefaultFeesConfig();
    }
  },

  // Configuration par défaut des frais
  getDefaultFeesConfig: function() {
    return {
      maternelle: {
        mensuel: 50,
        inscription: 100,
        trimestre1: 150,
        trimestre2: 150,
        trimestre3: 150
      },
      primaire: {
        mensuel: 60,
        inscription: 120,
        trimestre1: 180,
        trimestre2: 180,
        trimestre3: 180
      },
      secondaire: {
        mensuel: 70,
        inscription: 150,
        trimestre1: 210,
        trimestre2: 210,
        trimestre3: 210
      }
    };
  },

  // Sauvegarder la configuration des frais
  saveFeesConfig: function(config) {
    const key = 'cs_la_reference_configFees';
    try {
      localStorage.setItem(key, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Error saving fees config:', e);
      return false;
    }
  }
};

// Fonctions globales pour compatibilité
function loadPayments(studentId) {
  return Payments.loadPayments(studentId);
}

function savePayment(studentId, month, amount, date) {
  return Payments.savePayment(studentId, month, amount, date);
}

function getTotalPayments(studentId) {
  return Payments.getTotalPayments(studentId);
}
