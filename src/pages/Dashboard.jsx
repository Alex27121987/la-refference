import { useEffect, useState } from 'react';
import './Dashboard.css';
import { exportDashboardPDF } from '../utils/pdfExport';
import { getAccessibleClasses, getRoleLabel, ROLES } from '../utils/userManagement';

// Normalise un nom pour matcher les clés de storage
const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Lit les effectifs réels depuis localStorage (clés lr_students_Section_Classe)
const getSectionCounts = () => {
  const counts = { maternelle: 0, primaire: 0, secondaire: 0 };

  if (typeof window === 'undefined') return counts;

  Object.keys(localStorage)
    .filter((k) => k.startsWith('lr_students_'))
    .forEach((key) => {
      const parts = key.split('_');
      const sectionRaw = parts[2] || '';
      const section = normalize(sectionRaw);
      let bucket = null;
      if (section.includes('maternelle')) bucket = 'maternelle';
      else if (section.includes('primaire')) bucket = 'primaire';
      else if (section.includes('secondaire')) bucket = 'secondaire';
      if (!bucket) return;
      try {
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(arr)) counts[bucket] += arr.length;
      } catch (e) {
        // console.warn('Impossible de lire', key, e);
      }
    });

  return counts;
};

export default function Dashboard({ user, onSelectClass }) {
  const safeUser = user || {};
  const username = safeUser.username || 'Utilisateur';
  const roleLabel = getRoleLabel(safeUser.role || '');

  const [counts, setCounts] = useState(getSectionCounts());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Rafraîchir en temps réel (storage externe + rafraîchissement périodique pour le même onglet)
  useEffect(() => {
    const refresh = () => setCounts(getSectionCounts());

    // Événement storage (autres onglets)
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key.startsWith('lr_students_')) refresh();
    };

    // Rafraîchissement périodique pour capter les setItem du même onglet
    const interval = setInterval(refresh, 5000);

    // Lorsqu'on revient sur l'onglet
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);

    refresh();

    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);

  const sections = [
    {
      id: 'maternelle',
      name: 'Maternelle',
      icon: '👶',
      color: '#e74c3c',
      classes: ['1ère Mat', '2ème Mat', '3ème Mat'],
      students: counts.maternelle,
      teachers: 0,
    },
    {
      id: 'primaire',
      name: 'Primaire',
      icon: '📚',
      color: '#27ae60',
      classes: ['1ère', '2ème', '3ème', '4ème', '5ème', '6ème'],
      students: counts.primaire,
      teachers: 0,
    },
    {
      id: 'secondaire',
      name: 'Secondaire',
      icon: '🎓',
      color: '#3498db',
      classes: ['7EB', '8EB', '1', '2', '3', '4'],
      students: counts.secondaire,
      teachers: 0,
    }
  ];

  const handleSelectClass = (sectionName, className) => {
    if (onSelectClass) {
      onSelectClass(sectionName, className);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('🔄 Synchronisation en cours...');
    
    try {
      // Recharger les données depuis localStorage
      // TODO: Quand l'API sera disponible, ajouter ici:
      // 1. Envoyer les données locales vers le serveur (localStorage -> API)
      // 2. Récupérer les données du serveur (API -> localStorage)
      // 3. Fusionner les données (résolution de conflits)
      
      // Pour l'instant, on simule la synchronisation (1s) et on recharge les données locales
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recharger les compteurs depuis localStorage
      const updatedCounts = getSectionCounts();
      setCounts(updatedCounts);
      
      setSyncMessage('✓ Données actualisées');
      setTimeout(() => setSyncMessage(''), 2000);
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      setSyncMessage('✗ Échec de la synchronisation');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const totalStudents = sections.reduce((sum, s) => sum + s.students, 0);
  const totalTeachers = sections.reduce((sum, s) => sum + s.teachers, 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Bienvenue, {username} ! 👋</h2>
          <p>Rôle: {roleLabel}</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div>
              <div className="stat-value">{totalStudents}</div>
              <div className="stat-label">Élèves</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div>
              <div className="stat-value">{totalTeachers}</div>
              <div className="stat-label">Enseignants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏫</div>
            <div>
              <div className="stat-value">{sections.length}</div>
              <div className="stat-label">Sections</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', padding: '0 20px' }}>
        <h3 style={{ margin: 0 }}>📋 Sections</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {syncMessage && (
            <span style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: syncMessage.includes('✓') ? '#d4edda' : syncMessage.includes('✗') ? '#f8d7da' : '#fff3cd',
              color: syncMessage.includes('✓') ? '#155724' : syncMessage.includes('✗') ? '#721c24' : '#856404',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {syncMessage}
            </span>
          )}
          <button 
            onClick={() => exportDashboardPDF(sections)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📄 Télécharger PDF
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 20px',
              backgroundColor: syncing ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>🔄</span>
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      <div className="sections-grid">
        {sections.map(section => (
          <div key={section.id} className="section-card" style={{ borderTopColor: section.color }}>
            <div className="section-header" style={{ background: section.color }}>
              <span className="section-icon">{section.icon}</span>
              <h3>{section.name}</h3>
            </div>
            
            <div className="section-content">
              <div className="section-stats">
                <div><strong>{section.students}</strong> élèves</div>
                <div><strong>{section.teachers}</strong> enseignants</div>
              </div>
              
              <div className="classes-list">
                {section.classes.map((cls, idx) => (
                  <div 
                    key={idx} 
                    className="class-item"
                    onClick={() => handleSelectClass(section.name, cls)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="class-bullet">•</span> {cls}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
