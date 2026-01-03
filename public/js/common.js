// common.js - Fonctions partagées

function showNotification(message, type = 'info') {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Vérifier la connexion
function checkAuth() {
  const user = sessionStorage.getItem('user');
  if (!user && !window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
    window.location.href = '../index.html';
  }
}

// Logout
function logout() {
  sessionStorage.clear();
  window.location.href = '../index.html';
}

// Correction automatique des classKey au chargement
(function autoFixClassKeys() {
  const corrections = {
    '1ere-MA': 'secondaire-1ere-MA',
    '1ere-HP': 'secondaire-1ere-HP',
    '1ere-TCC': 'secondaire-1ere-TCC',
    '1ere-CG': 'secondaire-1ere-CG',
    '1ere-ELEC': 'secondaire-1ere-ELEC',
    '1ere-Construction': 'secondaire-1ere-Construction',
    '1ere-MG': 'secondaire-1ere-MG',
    '1ere-A': 'secondaire-1ere-A',
    '2eme-MA': 'secondaire-2eme-MA',
    '2eme-HP': 'secondaire-2eme-HP',
    '2eme-TCC': 'secondaire-2eme-TCC',
    '2eme-CG': 'secondaire-2eme-CG',
    '2eme-ELEC': 'secondaire-2eme-ELEC',
    '2eme-Construction': 'secondaire-2eme-Construction',
    '2eme-MG': 'secondaire-2eme-MG',
    '2eme-A': 'secondaire-2eme-A',
    '3eme-MA': 'secondaire-3eme-MA',
    '3eme-HP': 'secondaire-3eme-HP',
    '3eme-TCC': 'secondaire-3eme-TCC',
    '3eme-CG': 'secondaire-3eme-CG',
    '3eme-ELEC': 'secondaire-3eme-ELEC',
    '3eme-Construction': 'secondaire-3eme-Construction',
    '3eme-MG': 'secondaire-3eme-MG',
    '3eme-A': 'secondaire-3eme-A',
    '4eme-MA': 'secondaire-4eme-MA',
    '4eme-HP': 'secondaire-4eme-HP',
    '4eme-TCC': 'secondaire-4eme-TCC',
    '4eme-CG': 'secondaire-4eme-CG',
    '4eme-ELEC': 'secondaire-4eme-ELEC',
    '4eme-Construction': 'secondaire-4eme-Construction',
    '4eme-MG': 'secondaire-4eme-MG',
    '4eme-A': 'secondaire-4eme-A'
  };
  
  try {
    const studentsRaw = localStorage.getItem('cs_la_reference_students');
    if (!studentsRaw) return;
    
    const students = JSON.parse(studentsRaw);
    let corrected = false;
    
    const fixedStudents = students.map(student => {
      if (corrections[student.classKey]) {
        corrected = true;
        return { ...student, classKey: corrections[student.classKey] };
      }
      return student;
    });
    
    if (corrected) {
      localStorage.setItem('cs_la_reference_students', JSON.stringify(fixedStudents));
      console.log('✅ ClassKey corrigés automatiquement');
    }
  } catch(e) {
    console.error('Erreur lors de la correction des classKey:', e);
  }
})();

// Auto-check auth on every page except login
if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
  checkAuth();
}
