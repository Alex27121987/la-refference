import React, { useState, useEffect, useMemo } from 'react';
import './PaymentEntry.css';
import { hasPermission, PERMISSIONS } from '../utils/userManagement';

const CLASS_FILTERS = [
  { key: 'maternelle-1', label: 'Mat1' },
  { key: 'maternelle-2', label: 'Mat2' },
  { key: 'maternelle-3', label: 'Mat3' },
  { key: 'primaire-1', label: 'P1' },
  { key: 'primaire-2', label: 'P2' },
  { key: 'primaire-3', label: 'P3' },
  { key: 'primaire-4', label: 'P4' },
  { key: 'primaire-5', label: 'P5' },
  { key: 'primaire-6', label: 'P6' },
  { key: 'secondaire-7EBE', label: '7EB' },
  { key: 'secondaire-8EBE', label: '8EB' },
  { key: 'secondaire-1ere', label: '1ère' },
  { key: 'secondaire-2eme', label: '2ème' },
  { key: 'secondaire-3eme', label: '3ème' },
  { key: 'secondaire-4eme', label: '4ème' },
];

const MONTHLY_FEES = {
  maternelle: 0,
  primaire: 16500,
  '7ebe': 25000,
  '8ebe': 25000,
  secondaire: 30000,
};

// Charger tous les élèves depuis toutes les classes (lr_students_*)
const loadAllStudents = () => {
  if (typeof window === 'undefined') return [];
  const all = [];
  Object.keys(localStorage)
    .filter(k => k.startsWith('lr_students_'))
    .forEach(key => {
      try {
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(arr)) {
          // Extraire section/classe depuis la clé pour mapper vers classKey
          const parts = key.split('_'); // ['lr', 'students', 'Section', 'Classe']
          const section = (parts[2] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const classe = (parts[3] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          let classKey = '';
          if (section.includes('maternelle')) {
            const num = classe.match(/\d/)?.[0] || '1';
            classKey = `maternelle-${num}`;
          } else if (section.includes('primaire')) {
            const num = classe.match(/\d/)?.[0] || '1';
            classKey = `primaire-${num}`;
          } else if (section.includes('secondaire')) {
            if (classe.includes('7')) classKey = 'secondaire-7EBE';
            else if (classe.includes('8')) classKey = 'secondaire-8EBE';
            else if (classe.includes('1')) classKey = 'secondaire-1ere';
            else if (classe.includes('2')) classKey = 'secondaire-2eme';
            else if (classe.includes('3')) classKey = 'secondaire-3eme';
            else if (classe.includes('4')) classKey = 'secondaire-4eme';
          }
          
          arr.forEach(s => {
            all.push({
              ...s,
              classKey: classKey || 'unknown',
              totalPaid: 0, // sera calculé depuis les paiements
            });
          });
        }
      } catch (e) {
        // console.warn('Erreur lecture', key, e);
      }
    });
  return all;
};

// Charger tous les paiements (historique global)
const loadAllPayments = () => {
  if (typeof window === 'undefined') return [];
  const history = [];
  Object.keys(localStorage)
    .filter(k => k.startsWith('lr_payments_'))
    .forEach(key => {
      try {
        const map = JSON.parse(localStorage.getItem(key) || '{}');
        if (typeof map === 'object' && !Array.isArray(map)) {
          Object.entries(map).forEach(([studentId, payments]) => {
            if (typeof payments === 'object') {
              Object.entries(payments).forEach(([monthOrF, entry]) => {
                if (!entry) return;
                const amt = typeof entry === 'number' ? entry : (entry.amount || 0);
                const dt = typeof entry === 'object' ? (entry.date || entry.timestamp || new Date().toISOString()) : new Date().toISOString();
                history.push({
                  id: `${studentId}_${monthOrF}_${dt}`,
                  studentId,
                  studentName: '', // sera complété si besoin
                  date: dt.slice(0, 10),
                  amount: amt,
                  type: monthOrF,
                  classKey: '', // TODO: enrichir si besoin
                });
              });
            }
          });
        }
      } catch (e) {
        // console.warn('Erreur lecture paiements', key, e);
      }
    });
  return history.sort((a, b) => new Date(b.date) - new Date(a.date));
};

function getMonthlyFee(classKey) {
  if (!classKey) return 0;
  if (classKey.startsWith('maternelle')) return MONTHLY_FEES.maternelle;
  if (classKey.startsWith('primaire')) return MONTHLY_FEES.primaire;
  if (classKey === 'secondaire-7EBE') return MONTHLY_FEES['7ebe'];
  if (classKey === 'secondaire-8EBE') return MONTHLY_FEES['8ebe'];
  if (classKey.startsWith('secondaire')) return MONTHLY_FEES.secondaire;
  return 0;
}

export default function PaymentEntry({ onOpenSituation, onSelectClass, user }) {
  const canAddPayments = hasPermission(user, PERMISSIONS.ADD_PAYMENTS);
  const canEditPayments = hasPermission(user, PERMISSIONS.EDIT_PAYMENTS);
  
  if (!canAddPayments && !canEditPayments) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#e74c3c' }}>❌ Accès refusé</h2>
        <p>Vous n'avez pas la permission d'accéder à cette page.</p>
      </div>
    );
  }
  const [searchText, setSearchText] = useState('');
  const [students, setStudents] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('');
  const [paymentType, setPaymentType] = useState('monthly');
  const [trimesterAmount, setTrimesterAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeClass, setActiveClass] = useState(CLASS_FILTERS[0].key);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [focusZone, setFocusZone] = useState('search'); // 'classes', 'search', ou 'results'
  const [classIndex, setClassIndex] = useState(0);
  const [activeView, setActiveView] = useState('payment'); // 'payment', 'search', 'situation', 'historique', 'rapport', 'ordre'
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalSearchText, setGlobalSearchText] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date(reportDate).getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date(reportDate).getFullYear());
  const [showCalendar, setShowCalendar] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const searchInputRef = React.useRef(null);
  const classButtonsRef = React.useRef([]);

  // Charger les données réelles au montage
  useEffect(() => {
    const allStudents = loadAllStudents();
    const allPayments = loadAllPayments();
    setStudents(allStudents);
    setPaymentHistory(allPayments);
  }, []);

  // Synchroniser activeClass avec classIndex et mettre le focus sur le bouton actif
  useEffect(() => {
    setActiveClass(CLASS_FILTERS[classIndex].key);
    if (focusZone === 'classes' && classButtonsRef.current[classIndex]) {
      classButtonsRef.current[classIndex].focus();
    }
  }, [classIndex, focusZone]);

  const classLabel = useMemo(() => {
    const f = CLASS_FILTERS.find((c) => c.key === activeClass);
    return f ? f.label : '';
  }, [activeClass]);

  const filteredStudents = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return students.filter((s) => {
      const matchClass = s.classKey === activeClass || s.classKey?.startsWith(activeClass);
      if (!matchClass) return false;
      if (!q) return true;
      const fullName = `${s.nom} ${s.prenom}`.toLowerCase();
      return fullName.includes(q) || (s.matricule || '').toLowerCase().includes(q);
    });
  }, [students, searchText, activeClass]);

  useEffect(() => {
    setSelectedIndex(filteredStudents.length ? 0 : -1);
  }, [filteredStudents]);

  useEffect(() => {
    const handler = (e) => {
      // Navigation classes: ← → (quand focus sur un bouton classe)
      if (focusZone === 'classes') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setClassIndex((prev) => (prev - 1 + CLASS_FILTERS.length) % CLASS_FILTERS.length);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setClassIndex((prev) => (prev + 1) % CLASS_FILTERS.length);
          return;
        }
        // Enter depuis classe: revenir à la barre
        if (e.key === 'Enter') {
          e.preventDefault();
          setFocusZone('search');
          searchInputRef.current?.focus();
          return;
        }
      }
      
      // Navigation depuis la barre de recherche
      if (focusZone === 'search') {
        // ← → depuis barre: aller aux classes
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFocusZone('classes');
          setClassIndex((prev) => (prev - 1 + CLASS_FILTERS.length) % CLASS_FILTERS.length);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFocusZone('classes');
          setClassIndex((prev) => (prev + 1) % CLASS_FILTERS.length);
          return;
        }
        // ↑ depuis barre: aller aux classes (Mat1)
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusZone('classes');
          setClassIndex(0);
          return;
        }
        // ↓ depuis barre: aller aux résultats
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusZone('results');
          setSelectedIndex(0);
          return;
        }
        // PgDn depuis barre: aller aux résultats
        if (e.key === 'PageDown') {
          e.preventDefault();
          setFocusZone('results');
          setSelectedIndex(0);
          return;
        }
        // PgUp depuis barre: aller aux classes
        if (e.key === 'PageUp') {
          e.preventDefault();
          setFocusZone('classes');
          setClassIndex(0);
          return;
        }
      }
      
      // Navigation résultats: ↑ ↓
      if (focusZone === 'results' && filteredStudents.length) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredStudents.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredStudents.length) % filteredStudents.length);
          return;
        }
        // Enter depuis résultats: sélectionner élève
        if (e.key === 'Enter') {
          e.preventDefault();
          const s = filteredStudents[selectedIndex] || filteredStudents[0];
          if (s) handleSelectStudent(s);
          return;
        }
        // PgUp depuis résultats: aller à la barre
        if (e.key === 'PageUp') {
          e.preventDefault();
          setFocusZone('search');
          searchInputRef.current?.focus();
          return;
        }
      }
      
      // E pour enregistrer (global, hors champs actifs)
      const activeTag = document.activeElement?.tagName;
      const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag || '');
      if (e.key?.toLowerCase() === 'e' && selectedStudent && !loading && !isTyping) {
        e.preventDefault();
        handleSavePayment();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusZone, classIndex, filteredStudents, selectedIndex, selectedStudent, loading]);



  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchText('');
    setMessage('');
    const fee = getMonthlyFee(student.classKey);
    setAmount(fee ? String(fee) : '');
    setMonth('');
    setPaymentType('monthly');
    setTrimesterAmount('');
  };

  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedStudent) {
      setMessage('Sélectionnez un élève avant d’enregistrer');
      return;
    }
    const needsMonthly = paymentType === 'monthly' || paymentType === 'both';
    const needsTrimester = paymentType === 'trimester' || paymentType === 'both';

    if (needsMonthly && (!month || !amount)) {
      setMessage('Mois et montant mensuel requis');
      return;
    }
    if (needsTrimester && !trimesterAmount) {
      setMessage('Montant trimestriel requis');
      return;
    }

    setLoading(true);
    try {
      const monthlyPart = needsMonthly ? `${amount} CDF pour ${month || 'mois'}` : '';
      const trimesterPart = needsTrimester ? `${trimesterAmount} CDF (frais F)` : '';
      const summary = [monthlyPart, trimesterPart].filter(Boolean).join(' + ');
      setMessage(`✓ Paiement enregistré pour ${selectedStudent.nom} ${selectedStudent.prenom} (${summary})`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyNav = (e) => {
    if (!filteredStudents.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredStudents.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredStudents.length) % filteredStudents.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const s = filteredStudents[selectedIndex] || filteredStudents[0];
      if (s) handleSelectStudent(s);
    }
  };

  const handleClickAction = (action) => {
    switch(action) {
      case 'Rechercher':
        setActiveView('search');
        setGlobalSearchText('');
        setGlobalSearchResults([]);
        break;
      case 'Situation':
        setActiveView('situation');
        break;
      case 'Situation Financière': {
        // Naviguer vers la page FinancialSituation avec la classe active
        const classKey = activeClass || CLASS_FILTERS[0].key;
        // Extraire section et classe depuis classKey (ex: 'primaire-2' -> section='Primaire', classe='2ème')
        const [section, ...classeParts] = classKey.split('-');
        let sectionName = section.charAt(0).toUpperCase() + section.slice(1);
        let className = classeParts.join('-');
        
        // Mapper les classKeys vers les noms de classes réels
        if (section === 'maternelle') {
          className = className + 'ère Mat';
        } else if (section === 'primaire') {
          className = className + 'ème';
        } else if (section === 'secondaire') {
          if (className === '7EBE') className = '7ÈME EB';
          else if (className === '8EBE') className = '8ÈME EB';
          else if (className === '1ere') className = '1ÈRE';
          else if (className === '2eme') className = '2ÈME';
          else if (className === '3eme') className = '3ÈME';
          else if (className === '4eme') className = '4ÈME';
        }
        
        if (onSelectClass) {
          onSelectClass(sectionName, className);
        }
        break;
      }
      case 'Actualiser':
        // Rafraîchir les données - recharger depuis localStorage
        const allStudentsRefresh = loadAllStudents();
        const allPaymentsRefresh = loadAllPayments();
        setStudents(allStudentsRefresh);
        setPaymentHistory(allPaymentsRefresh);
        setMessage('✓ Données actualisées');
        setTimeout(() => setMessage(''), 2000);
        break;
      case 'Historique':
        setActiveView('historique');
        break;
      case 'Rapport par date':
        setActiveView('rapport');
        break;
      case 'En ordre / Pas en ordre':
        setActiveView('ordre');
        break;
      default:
        break;
    }
  };

  const handleGlobalSearch = (query) => {
    const searchQuery = (query || globalSearchText).trim().toLowerCase();
    if (!searchQuery) {
      setGlobalSearchResults([]);
      return;
    }
    
    const results = students.filter((s) => {
      const nom = (s.nom || '').toLowerCase();
      const prenom = (s.prenom || '').toLowerCase();
      const postnom = (s.postnom || '').toLowerCase();
      const matricule = (s.matricule || '').toLowerCase();
      
      return nom.includes(searchQuery) || 
             prenom.includes(searchQuery) || 
             postnom.includes(searchQuery) ||
             matricule.includes(searchQuery);
    });
    
    setGlobalSearchResults(results);
  };

  // Composant: Vue de recherche avancée
  const SearchView = () => (
    <div className="view-container">
      <div className="view-header">
        <h2>🔍 Recherche globale</h2>
        <button className="btn-close" onClick={() => setActiveView('payment')}>✕ Fermer</button>
      </div>
      <div className="view-content">
        <div className="form-group">
          <label>Nom, Post-nom, Prénom ou Matricule</label>
          <input 
            type="text" 
            placeholder="Tapez pour rechercher dans toutes les classes..." 
            value={globalSearchText}
            onChange={(e) => {
              const newValue = e.target.value;
              setGlobalSearchText(newValue);
              handleGlobalSearch(newValue);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGlobalSearch();
              }
            }}
            autoFocus
          />
        </div>
        <button className="btn-search-apply" onClick={() => handleGlobalSearch()}>
          🔍 Rechercher
        </button>
        
        {globalSearchResults.length > 0 && (
          <div className="search-results-section">
            <h3 className="results-title">
              {globalSearchResults.length} élève(s) trouvé(s)
            </h3>
            <div className="global-results-list">
              {globalSearchResults.map((student) => (
                <div 
                  key={student.id} 
                  className="global-result-item"
                  onClick={() => {
                    setSelectedStudent(student);
                    setActiveView('payment');
                    const fee = getMonthlyFee(student.classKey);
                    setAmount(fee ? String(fee) : '');
                    setMonth('');
                    setPaymentType('monthly');
                  }}
                >
                  <div className="result-name">
                    {student.nom} {student.prenom}
                  </div>
                  <div className="result-details">
                    <span className="result-matricule">{student.matricule}</span>
                    <span className="result-class">{student.classKey?.replace(/-/g, ' ').toUpperCase()}</span>
                    <span className="result-paid">Payé: {student.totalPaid.toLocaleString('fr-FR')} CDF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {globalSearchText && globalSearchResults.length === 0 && (
          <div className="no-results">
            ⚠️ Aucun élève trouvé pour "{globalSearchText}"
          </div>
        )}
      </div>
    </div>
  );

  // Composant: Vue de situation
  const SituationView = () => (
    <div className="view-container">
      <div className="view-header">
        <h2>📊 Situation des paiements</h2>
        <button className="btn-close" onClick={() => setActiveView('payment')}>✕ Fermer</button>
      </div>
      <div className="view-content situation-grid">
        <div className="situation-card">
          <div className="card-label">Total payé (tous)</div>
          <div className="card-value">{students.reduce((s, st) => s + st.totalPaid, 0).toLocaleString('fr-FR')} CDF</div>
        </div>
        <div className="situation-card">
          <div className="card-label">Élèves à jour</div>
          <div className="card-value">{students.filter(s => s.totalPaid >= getMonthlyFee(s.classKey) * 3).length}</div>
        </div>
        <div className="situation-card">
          <div className="card-label">Élèves en retard</div>
          <div className="card-value">{students.filter(s => s.totalPaid < getMonthlyFee(s.classKey) * 3).length}</div>
        </div>
        <div className="situation-card">
          <div className="card-label">Non payé (0 CDF)</div>
          <div className="card-value">{students.filter(s => s.totalPaid === 0).length}</div>
        </div>
      </div>
      <div className="situation-table">
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Classe</th>
              <th>Payé</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.nom} {s.prenom}</td>
                <td>{s.classKey?.replace(/-/g, ' ').toUpperCase()}</td>
                <td>{s.totalPaid.toLocaleString('fr-FR')} CDF</td>
                <td className={s.totalPaid > 0 ? 'status-paid' : 'status-unpaid'}>
                  {s.totalPaid > 0 ? '✓ Payé' : '✗ Non payé'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Composant: Vue historique
  const HistoriqueView = () => {
    const filteredHistory = historyFilter === 'all' 
      ? paymentHistory 
      : paymentHistory.filter(p => p.studentId === historyFilter);
    
    const sortedHistory = [...filteredHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    };
    
    return (
      <div className="view-container">
        <div className="view-header">
          <h2>📜 Historique des paiements</h2>
          <button className="btn-close" onClick={() => setActiveView('payment')}>✕ Fermer</button>
        </div>
        <div className="view-content">
          <div className="form-group">
            <label>Filtrer par élève</label>
            <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}>
              <option value="all">-- Tous les élèves --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.nom} {s.prenom} ({s.matricule})</option>
              ))}
            </select>
          </div>
          
          <div className="history-summary">
            <div className="summary-badge">
              <span>Total des paiements:</span>
              <strong>{sortedHistory.length}</strong>
            </div>
            <div className="summary-badge">
              <span>Montant total:</span>
              <strong>{sortedHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString('fr-FR')} CDF</strong>
            </div>
          </div>
          
          <div className="historique-list">
            {sortedHistory.map((payment) => (
              <div key={payment.id} className="historique-item">
                <div className="item-date">📅 {formatDate(payment.date)}</div>
                <div className="item-student">
                  👤 {payment.studentName}
                  <span className="student-class-badge">{payment.classKey?.replace(/-/g, ' ').toUpperCase()}</span>
                </div>
                <div className="item-amount">💰 {payment.amount.toLocaleString('fr-FR')} CDF ({payment.type})</div>
              </div>
            ))}
            
            {sortedHistory.length === 0 && (
              <div className="no-history">
                ⚠️ Aucun paiement enregistré
                {historyFilter !== 'all' && ' pour cet élève'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Composant: Vue rapport par date
  const RapportView = () => {
    const paymentsForDate = paymentHistory.filter(p => p.date === reportDate);
    const totalAmount = paymentsForDate.reduce((sum, p) => sum + p.amount, 0);
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    };
    
    const formatDateShort = (dateStr) => {
      const date = new Date(dateStr);
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    };
    
    const handleMonthChange = (direction) => {
      let newMonth = calendarMonth + direction;
      let newYear = calendarYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setCalendarMonth(newMonth);
      setCalendarYear(newYear);
    };
    
    const selectDate = (day) => {
      const selectedDate = new Date(calendarYear, calendarMonth, day);
      setReportDate(selectedDate.toISOString().split('T')[0]);
      setShowCalendar(false);
    };
    
    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (year, month) => {
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1; // Convertir dimanche (0) en 6, et décaler les autres
    };
    
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const daysArray = [];
    
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    
    return (
      <div className="view-container">
        <div className="view-header">
          <h2>📅 Rapport par date</h2>
          <button className="btn-close" onClick={() => setActiveView('payment')}>✕ Fermer</button>
        </div>
        <div className="view-content">
          <div className="date-selection-container">
            <div className="date-selector-wrapper">
              <button 
                className="date-display-btn" 
                onClick={() => setShowCalendar(!showCalendar)}
              >
                📅 {formatDateShort(reportDate)}
              </button>
              
              {showCalendar && (
                <div className="calendar-dropdown">
                  <div className="calendar-nav">
                    <button className="btn-nav-month" onClick={() => handleMonthChange(-1)}>◀</button>
                    <span className="calendar-title">{monthNames[calendarMonth]} {calendarYear}</span>
                    <button className="btn-nav-month" onClick={() => handleMonthChange(1)}>▶</button>
                  </div>
                  
                  <div className="calendar-grid">
                    <div className="calendar-weekday">L</div>
                    <div className="calendar-weekday">M</div>
                    <div className="calendar-weekday">M</div>
                    <div className="calendar-weekday">J</div>
                    <div className="calendar-weekday">V</div>
                    <div className="calendar-weekday">S</div>
                    <div className="calendar-weekday">D</div>
                    
                    {daysArray.map((day, idx) => {
                      const isSelected = day && reportDate === `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      return (
                        <button
                          key={idx}
                          className={`calendar-day-btn ${day ? '' : 'empty'} ${isSelected ? 'selected' : ''}`}
                          onClick={() => day && selectDate(day)}
                          disabled={!day}
                        >
                          {day || ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="rapport-summary">
            <div className="summary-item">
              <span>Date sélectionnée:</span>
              <strong>{formatDate(reportDate)}</strong>
            </div>
            <div className="summary-item">
              <span>Nombre de paiements:</span>
              <strong>{paymentsForDate.length}</strong>
            </div>
            <div className="summary-item">
              <span>Montant total:</span>
              <strong>{totalAmount.toLocaleString('fr-FR')} CDF</strong>
            </div>
          </div>
          
          {paymentsForDate.length > 0 ? (
            <div className="rapport-list">
              <h3 className="rapport-list-title">📋 Élèves ayant payé ce jour</h3>
              {paymentsForDate.map((payment) => (
                <div key={payment.id} className="rapport-item">
                  <div className="rapport-student">
                    <span className="rapport-name">👤 {payment.studentName}</span>
                    <span className="rapport-class">{payment.classKey?.replace(/-/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="rapport-payment-info">
                    <span className="rapport-type">{payment.type}</span>
                    <span className="rapport-amount">💰 {payment.amount.toLocaleString('fr-FR')} CDF</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-rapport">
              ⚠️ Aucun paiement enregistré pour cette date
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant: Vue Situation Financière (tableau détaillé par élève)
  const SituationFinanciereView = () => {
    const [situationSelectedClass, setSituationSelectedClass] = useState(CLASS_FILTERS[0].key);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState(mockPaymentHistory);

    const filteredStudentsForSituation = students.filter(s => {
      const classMatch = s.classKey === situationSelectedClass || s.classKey?.startsWith(situationSelectedClass);
      return classMatch;
    });

    const monthNames = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre',
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'
    ];

    const monthValues = ['9', '10', '11', '12', '1', '2', '3', '4', '5', '6'];

    // Détermine si un élève doit payer un mois
    const shouldPayForMonth = (student, targetMonth) => {
      if (!student.dateInscription || !targetMonth) return false;

      const inscriptionDate = new Date(student.dateInscription);
      const inscriptionYear = inscriptionDate.getFullYear();
      const inscriptionMonth = inscriptionDate.getMonth() + 1;
      const inscriptionDay = inscriptionDate.getDate();

      const targetMonthNum = parseInt(targetMonth);

      let targetYear;
      if (targetMonthNum >= 9) {
        targetYear = inscriptionYear;
      } else {
        targetYear = inscriptionYear + 1;
      }

      const targetDate = new Date(targetYear, targetMonthNum - 1, 20); // Le 20 du mois cible

      // L'élève doit payer si inscrit avant le 20 du mois
      if (inscriptionDate <= targetDate) {
        return true;
      }

      return false;
    };

    // Vérifie si une dette existe (après le 5 du mois suivant)
    const isDebt = (targetMonth) => {
      const now = new Date();
      // Normaliser en UTC pour éviter les décalages de fuseau
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const targetMonthNum = parseInt(targetMonth, 10);

      // Année scolaire basée sur septembre → juin
      const currentMonth = today.getUTCMonth() + 1;
      const schoolYearStart = currentMonth >= 9 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
      const targetYear = targetMonthNum >= 9 ? schoolYearStart : schoolYearStart + 1;

      // Début du mois cible
      const monthStartDate = new Date(Date.UTC(targetYear, targetMonthNum - 1, 1));
      if (today < monthStartDate) {
        // Mois pas commencé => non-dette (gris)
        return false;
      }

      // La dette démarre le 5 du mois suivant
      let debtStartMonth = targetMonthNum + 1;
      let debtStartYear = targetYear;
      if (debtStartMonth > 12) {
        debtStartMonth = 1;
        debtStartYear += 1;
      }
      const debtStartDate = new Date(Date.UTC(debtStartYear, debtStartMonth - 1, 5));

      return today >= debtStartDate;
    };

    // Récupère le statut de paiement pour un mois
    const getMonthPaymentStatus = (student, monthValue) => {
      // Non concerné
      if (!shouldPayForMonth(student, monthValue)) {
        return 'non-concerne';
      }

      // Si le mois n'a pas commencé, on reste en non-dette (gris)
      const monthIdx = monthValues.indexOf(monthValue);
      const monthName = monthNames[monthIdx];
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

      const currentMonth = todayUTC.getUTCMonth() + 1;
      const currentYear = todayUTC.getUTCFullYear();
      const targetMonthNum = parseInt(monthValue, 10);
      const schoolYearStart = currentMonth >= 9 ? currentYear : currentYear - 1;
      const targetYear = targetMonthNum >= 9 ? schoolYearStart : schoolYearStart + 1;

      const monthStartDate = new Date(Date.UTC(targetYear, targetMonthNum - 1, 1));
      if (todayUTC < monthStartDate) {
        return 'non-dette';
      }

      const payments = paymentHistory.filter(
        p => p.studentId === student.id && p.type === monthName
      );

      if (!payments.length) {
        return isDebt(monthValue) ? 'en-souffrance' : 'non-dette';
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const monthlyAmount = 16500; // Montant standard

      if (totalPaid >= monthlyAmount) {
        return 'paye';
      }
      return 'partiellement-paye';
    };

    // Récupère le statut pour les frais F
    const getFPaymentStatus = (student, fType) => {
      const payments = paymentHistory.filter(
        p => p.studentId === student.id && p.type === fType
      );

      if (!payments.length) {
        return 'non-paye';
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const fAmount = 50000; // Montant standard F

      if (totalPaid >= fAmount) {
        return 'paye';
      }
      return 'partiellement-paye';
    };

    const handleDeletePayment = (paymentId) => {
      setPaymentHistory(paymentHistory.filter(p => p.id !== paymentId));
    };

    const handleSavePayment = (updatedPayment) => {
      setPaymentHistory(paymentHistory.map(p =>
        p.id === updatedPayment.id ? updatedPayment : p
      ));
      setEditingPayment(null);
    };

    return (
      <div className="view-container">
        <div className="view-header">
          <h2>💰 Situation financière</h2>
          <button className="btn-close" onClick={() => setActiveView('payment')}>✕ Fermer</button>
        </div>
        <div className="view-content">
          <div className="situation-filters">
            <div className="form-group">
              <label>Sélectionner une classe</label>
              <select value={situationSelectedClass} onChange={(e) => setSituationSelectedClass(e.target.value)}>
                {CLASS_FILTERS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="situation-table-wrapper">
            <table className="situation-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Matricule</th>
                  <th>Nom Complet</th>
                  <th>Inscrit le</th>
                  {monthNames.map(m => (
                    <th key={m} className="month-header">{m.slice(0, 3)}</th>
                  ))}
                  <th>F1</th>
                  <th>F2</th>
                  <th>F3</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentsForSituation.map((student, idx) => (
                  <tr key={student.id} className="situation-student-row">
                    <td className="student-index">{idx + 1}</td>
                    <td className="student-matricule">{student.matricule}</td>
                    <td className="student-name">{student.nom} {student.prenom}</td>
                    <td className="student-inscription">
                      {new Date(student.dateInscription).toLocaleDateString('fr-FR')}
                    </td>
                    {monthValues.map(monthValue => {
                      const status = getMonthPaymentStatus(student, monthValue);
                      return (
                        <td
                          key={monthValue}
                          className={`month-cell month-${status}`}
                          title={monthNames[monthValues.indexOf(monthValue)]}
                        >
                          <span className="status-badge">
                            {status === 'non-concerne'
                              ? '-'
                              : status === 'non-dette'
                                ? '—'
                                : status === 'paye'
                                  ? '✓'
                                  : status === 'partiellement-paye'
                                    ? '◐'
                                    : '✗'}
                          </span>
                        </td>
                      );
                    })}
                    <td className={`f-cell f-${getFPaymentStatus(student, 'F1')}`}>
                      {getFPaymentStatus(student, 'F1') === 'paye' ? '✓' : getFPaymentStatus(student, 'F1') === 'partiellement-paye' ? '◐' : '✗'}
                    </td>
                    <td className={`f-cell f-${getFPaymentStatus(student, 'F2')}`}>
                      {getFPaymentStatus(student, 'F2') === 'paye' ? '✓' : getFPaymentStatus(student, 'F2') === 'partiellement-paye' ? '◐' : '✗'}
                    </td>
                    <td className={`f-cell f-${getFPaymentStatus(student, 'F3')}`}>
                      {getFPaymentStatus(student, 'F3') === 'paye' ? '✓' : getFPaymentStatus(student, 'F3') === 'partiellement-paye' ? '◐' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="situation-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#ccc' }}></span>
              <span>Non concerné</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#95a5a6' }}></span>
              <span>Non dû (pas encore en dette)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#27ae60' }}></span>
              <span>Totalement payé</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#f39c12' }}></span>
              <span>Partiellement payé</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#e74c3c' }}></span>
              <span>En souffrance/Non payé</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Composant: Vue en ordre/pas en ordre
  const OrdreView = () => {
    const [ordreSelectedClass, setOrdreSelectedClass] = useState(CLASS_FILTERS[0].key);
    const [ordrePaymentType, setOrdrePaymentType] = useState('monthly');
    const [ordreMonth, setOrdreMonth] = useState('9'); // Septembre par défaut
    
    const filteredStudentsForOrdre = students.filter(s => {
      const classMatch = s.classKey === ordreSelectedClass || s.classKey?.startsWith(ordreSelectedClass);
      return classMatch;
    });
    
    const monthNames = [
      'Septembre', 'Octobre', 'Novembre', 'Décembre', 
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'
    ];
    
    const monthValues = ['9', '10', '11', '12', '1', '2', '3', '4', '5', '6'];
    
    const shouldPayForMonth = (student, targetMonth) => {
      if (!student.dateInscription || !targetMonth) return false;

      const inscriptionDate = new Date(student.dateInscription);
      const inscriptionDay = inscriptionDate.getDate();
      const targetMonthNum = parseInt(targetMonth, 10);

      // Année scolaire: septembre -> juin, basée sur la date courante
      const now = new Date();
      const schoolYearStart = (now.getMonth() + 1) >= 9 ? now.getFullYear() : now.getFullYear() - 1;
      const targetYear = targetMonthNum >= 9 ? schoolYearStart : schoolYearStart + 1;

      const targetDate = new Date(targetYear, targetMonthNum - 1, 20); // 20 du mois cible

      // Si l'élève est inscrit avant (ou le 20) du mois cible, il doit payer
      if (inscriptionDate <= targetDate) return true;

      // Sinon, pas concerné pour ce mois
      return false;
    };
    
    const checkStudentStatus = (student) => {
      if (ordrePaymentType === 'monthly' && ordreMonth) {
        // Vérifier si l'élève doit payer ce mois
        const mustPay = shouldPayForMonth(student, ordreMonth);
        
        if (!mustPay) {
          return 'non-concerne'; // L'élève n'est pas concerné par ce paiement
        }
        
        // Vérifier si l'élève a payé pour ce mois spécifique
        const monthName = monthNames[monthValues.indexOf(ordreMonth)];
        const monthPayment = mockPaymentHistory.find(
          p => p.studentId === student.id && p.type === monthName
        );
        return monthPayment ? 'en-ordre' : 'pas-en-ordre';
        
      } else if (ordrePaymentType === 'F1' || ordrePaymentType === 'F2' || ordrePaymentType === 'F3') {
        // Pour les frais F, tous les élèves sont tenus de payer
        const fPayment = mockPaymentHistory.find(
          p => p.studentId === student.id && p.type === ordrePaymentType
        );
        return fPayment ? 'en-ordre' : 'pas-en-ordre';
      }
      
      return 'pas-en-ordre';
    };
    
    return (
      <div className="view-container">
        <div className="view-header">
          <h2>📋 Statut de paiement</h2>
          <button className="btn-close" onClick={() => setActiveView('payment')}>✕ Fermer</button>
        </div>
        <div className="view-content">
          <div className="ordre-filters">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Sélectionner une classe</label>
              <select value={ordreSelectedClass} onChange={(e) => setOrdreSelectedClass(e.target.value)}>
                {CLASS_FILTERS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Type de paiement</label>
              <select value={ordrePaymentType} onChange={(e) => setOrdrePaymentType(e.target.value)}>
                <option value="monthly">Frais mensuel</option>
                <option value="F1">F1</option>
                <option value="F2">F2</option>
                <option value="F3">F3</option>
              </select>
            </div>
            
            {ordrePaymentType === 'monthly' && (
              <div className="form-group" style={{ flex: 1 }}>
                <label>Sélectionner un mois</label>
                <select value={ordreMonth} onChange={(e) => setOrdreMonth(e.target.value)}>
                  <option value="">-- Choisir un mois --</option>
                  <option value="9">Septembre</option>
                  <option value="10">Octobre</option>
                  <option value="11">Novembre</option>
                  <option value="12">Décembre</option>
                  <option value="1">Janvier</option>
                  <option value="2">Février</option>
                  <option value="3">Mars</option>
                  <option value="4">Avril</option>
                  <option value="5">Mai</option>
                  <option value="6">Juin</option>
                </select>
              </div>
            )}
            
            {(ordrePaymentType === 'F1' || ordrePaymentType === 'F2' || ordrePaymentType === 'F3') && (
              <div className="form-group" style={{ flex: 1 }}>
                <label>Frais sélectionné</label>
                <div className="form-input" style={{ background: '#3498db20', color: '#3498db', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ordrePaymentType}
                </div>
              </div>
            )}
          </div>
          
          {(ordreMonth || ordrePaymentType === 'F1' || ordrePaymentType === 'F2' || ordrePaymentType === 'F3') && (
            <div className="ordre-list">
              <div className="ordre-summary">
                <span className="summary-badge en-ordre">
                  ✓ En ordre: {filteredStudentsForOrdre.filter(s => checkStudentStatus(s) === 'en-ordre').length}
                </span>
                <span className="summary-badge pas-ordre">
                  ✗ Pas en ordre: {filteredStudentsForOrdre.filter(s => checkStudentStatus(s) === 'pas-en-ordre').length}
                </span>
                {ordrePaymentType === 'monthly' && (
                  <span className="summary-badge non-concerne">
                    ○ Non concernés: {filteredStudentsForOrdre.filter(s => checkStudentStatus(s) === 'non-concerne').length}
                  </span>
                )}
              </div>
              
              {filteredStudentsForOrdre.map((student) => {
                const status = checkStudentStatus(student);
                return (
                  <div key={student.id} className={`ordre-item ${status}`}>
                    <div className="ordre-status-badge">
                      {status === 'en-ordre' ? '✓ EN ORDRE' : 
                       status === 'non-concerne' ? '○ NON CONCERNÉ' : 
                       '✗ PAS EN ORDRE'}
                    </div>
                    <div className="ordre-student-info">
                      <span className="ordre-name">👤 {student.nom} {student.prenom}</span>
                      <span className="ordre-class">{student.classKey?.replace(/-/g, ' ').toUpperCase()}</span>
                      <span className="ordre-inscription">
                        📅 Inscrit le: {new Date(student.dateInscription).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="ordre-amount-paid">
                      Payé: {student.totalPaid.toLocaleString('fr-FR')} CDF
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {!ordreMonth && ordrePaymentType === 'monthly' && (
            <div className="no-rapport">
              ⚠️ Sélectionnez un mois pour afficher le statut
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="payment-entry">
      <div className="header-bar">
        <div className="title">💰 Paiement rapide</div>
        <div className="actions">
          <button onClick={() => handleClickAction('Rechercher')} className="pill purple" title="Rechercher">
            <span className="icon">🔍</span>
            <span className="text">Rechercher</span>
          </button>
          <button onClick={() => handleClickAction('Situation')} className="pill yellow" title="Situation">
            <span className="icon">📊</span>
            <span className="text">Situation</span>
          </button>
          <button onClick={() => handleClickAction('Situation Financière')} className="pill pink" title="Situation Financière">
            <span className="icon">💰</span>
            <span className="text">Sit. Financière</span>
          </button>
          <button onClick={() => handleClickAction('Actualiser')} className="pill green" title="Actualiser">
            <span className="icon">🔄</span>
            <span className="text">Actualiser</span>
          </button>
          <button onClick={() => handleClickAction('Historique')} className="pill orange" title="Historique">
            <span className="icon">📜</span>
            <span className="text">Historique</span>
          </button>
          <span className="divider" />
          <button onClick={() => handleClickAction('Rapport par date')} className="pill teal" title="Rapport par date">
            <span className="icon">📅</span>
            <span className="text">Rapport date</span>
          </button>
          <button onClick={() => handleClickAction('En ordre / Pas en ordre')} className="pill red" title="En ordre / Pas en ordre">
            <span className="icon">📋</span>
            <span className="text">En ordre</span>
          </button>
        </div>
      </div>

      {/* Afficher le message de statut */}
      {message && (
        <div style={{
          padding: '12px 20px',
          margin: '10px 20px',
          borderRadius: '6px',
          backgroundColor: message.startsWith('✓') ? '#d4edda' : '#f8d7da',
          color: message.startsWith('✓') ? '#155724' : '#721c24',
          fontSize: '14px',
          fontWeight: '500',
          border: `1px solid ${message.startsWith('✓') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* Afficher les vues appropriées */}
      {activeView === 'search' && <SearchView />}
      {activeView === 'situation' && <SituationView />}
      {activeView === 'situationFinanciere' && <SituationFinanciereView />}
      {activeView === 'historique' && <HistoriqueView />}
      {activeView === 'rapport' && <RapportView />}
      {activeView === 'ordre' && <OrdreView />}

      {/* Afficher la vue de paiement si actif */}
      {activeView === 'payment' && (
        <>
          <div className="class-filters">
            {CLASS_FILTERS.map((c, idx) => (
              <button
                key={c.key}
                ref={(el) => { if (el) classButtonsRef.current[idx] = el; }}
                className={`class-filter-btn ${CLASS_FILTERS[classIndex].key === c.key ? 'active' : ''} ${focusZone === 'classes' && classIndex === idx ? 'focused' : ''}`}
                onClick={() => {
                  setClassIndex(idx);
                  setFocusZone('classes');
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="search-container">
            <div className="search-box">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Tapez le nom, prénom ou matricule..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  // Les touches sont gérées dans le handler global window keydown
                }}
                onFocus={() => setFocusZone('search')}
                autoFocus
              />
            </div>
            {searchText && (
              <div className="results-container">
                <div className="results-info">{filteredStudents.length} élève(s) — {classLabel}</div>
                {filteredStudents.map((student, idx) => {
                  const isActive = idx === selectedIndex && focusZone === 'results';
                  const fullName = `${student.nom} ${student.prenom}`.trim();
                  return (
                    <div
                      key={student.id}
                      className={`student-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setFocusZone('results');
                        setSelectedIndex(idx);
                        handleSelectStudent(student);
                      }}
                    >
                      <div className="student-info">
                        <div className="student-name">{fullName}</div>
                        <div className="student-details">
                          {student.matricule} | {student.classKey?.replace(/-/g, ' ').toUpperCase()} | Payé: {student.totalPaid.toLocaleString('fr-FR')} CDF
                        </div>
                      </div>
                      <button className="select-btn">Sélectionner</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedStudent && (
            <>
              <div className="selected-student">
                <h3>👤 {selectedStudent.nom} {selectedStudent.prenom}</h3>
                <p><strong>Matricule:</strong> {selectedStudent.matricule}</p>
                <p><strong>Classe:</strong> {selectedStudent.classKey?.replace(/-/g, ' ').toUpperCase()}</p>
                <p><strong>Déjà payé:</strong> {selectedStudent.totalPaid.toLocaleString('fr-FR')} CDF</p>
              </div>

              <form className="payment-form active" onSubmit={handleSavePayment}>
                {message && (
                  <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <div className="form-group">
                  <label>Type de paiement</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} disabled={loading}>
                    <option value="monthly">Frais mensuel</option>
                    <option value="trimester">Frais trimestriel (F1/F2/F3)</option>
                    <option value="both">Les deux</option>
                  </select>
                </div>

                {(paymentType === 'monthly' || paymentType === 'both') && (
                  <>
                    <div className="form-group">
                      <label>Mois</label>
                      <select value={month} onChange={(e) => setMonth(e.target.value)} disabled={loading}>
                        <option value="">-- Choisir un mois --</option>
                        <option value="9">Septembre</option>
                        <option value="10">Octobre</option>
                        <option value="11">Novembre</option>
                        <option value="12">Décembre</option>
                        <option value="1">Janvier</option>
                        <option value="2">Février</option>
                        <option value="3">Mars</option>
                        <option value="4">Avril</option>
                        <option value="5">Mai</option>
                        <option value="6">Juin</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Montant frais mensuel (CDF)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Montant"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {(paymentType === 'trimester' || paymentType === 'both') && (
                  <div className="form-group">
                    <label>Montant frais F (CDF)</label>
                    <input
                      type="number"
                      value={trimesterAmount}
                      onChange={(e) => setTrimesterAmount(e.target.value)}
                      placeholder="Montant F1/F2/F3"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="fee-info">
                  💡 Frais mensuel indicatif: {getMonthlyFee(selectedStudent.classKey).toLocaleString('fr-FR')} CDF
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : '💾 Enregistrer le paiement (E)'}
                </button>

                <button type="button" className="btn-cancel" onClick={() => setSelectedStudent(null)} disabled={loading}>
                  Annuler
                </button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}
