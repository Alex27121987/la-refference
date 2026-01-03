import React, { useState, useEffect, useMemo } from 'react';
import './FinancialSituation.css';
import { exportFinancialSituationPDF } from '../utils/pdfExport';

// Normaliser les clés de storage pour éviter les problèmes d'accents/espaces
const normalizeStorageKey = (section, className) => {
  const s = (section || 'Section').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const c = (className || 'Classe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return `lr_students_${s}_${c}`;
};

const normalizePaymentsKey = (section, className) => {
  const s = (section || 'Section').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const c = (className || 'Classe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return `lr_payments_${s}_${c}`;
};

// Mois utilisés par les anciennes données (cs_la_reference_*). Clés = stockage, label = affichage.
const monthDefs = [
  { key: 'sept', label: 'SEPT', num: 9 },
  { key: 'oct', label: 'OCT', num: 10 },
  { key: 'nov', label: 'NOV', num: 11 },
  { key: 'dec', label: 'DÉC', num: 12 },
  { key: 'jan', label: 'JAN', num: 1 },
  { key: 'fev', label: 'FÉV', num: 2 },
  { key: 'mars', label: 'MARS', num: 3 },
  { key: 'avr', label: 'AVR', num: 4 },
  { key: 'mai', label: 'MAI', num: 5 },
  { key: 'juin', label: 'JUIN', num: 6 },
];

const F_KEYS = ['f1', 'f2', 'f3'];

// Détermine le frais mensuel selon la section
// Maternelle & Primaire : 16 500 ; Secondaire (7EB à 4ème) : 25 000
const getMonthlyFee = (sectionName, className) => {
  const key = (sectionName || '').toLowerCase();
  const cls = (className || '').toLowerCase();
  const isSecondaire = key.includes('secondaire') || ['7eb','8eb','1','2','3','4'].some(tok => cls.startsWith(tok));
  if (isSecondaire) return 25000;
  // par défaut maternelle/primaire
  return 16500;
};

const computeClassKey = (sectionName, className) => {
  const s = (sectionName || '').trim().toLowerCase();
  const c = (className || '').trim().toLowerCase();
  if (s.includes('maternelle')) {
    const num = c.match(/\d/)?.[0] || '1';
    return `maternelle-${num}`;
  }
  if (s.includes('primaire')) {
    const num = c.match(/\d/)?.[0] || '1';
    return `primaire-${num}`;
  }
  if (s.includes('secondaire')) {
    if (c.startsWith('7')) return 'secondaire-7ebe';
    if (c.startsWith('8')) return 'secondaire-8ebe';
    if (c.startsWith('1')) return 'secondaire-1ere';
    if (c.startsWith('2')) return 'secondaire-2eme';
    if (c.startsWith('3')) return 'secondaire-3eme';
    if (c.startsWith('4')) return 'secondaire-4eme';
  }
  return '';
};

export default function FinancialSituation({ selectedClass, onBack }) {
  const [students, setStudents] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [paymentsMap, setPaymentsMap] = useState({});

  const monthlyFee = useMemo(
    () => getMonthlyFee(selectedClass?.sectionName, selectedClass?.className),
    [selectedClass]
  );

  const storageKey = useMemo(() => {
    if (!selectedClass) return '';
    return normalizeStorageKey(selectedClass.sectionName, selectedClass.className);
  }, [selectedClass]);

  const paymentsKey = useMemo(() => {
    if (!selectedClass) return '';
    return normalizePaymentsKey(selectedClass.sectionName, selectedClass.className);
  }, [selectedClass]);

  // Charger les élèves de la classe courante (même clé que ClassDetail)
  useEffect(() => {
    if (!storageKey) {
      setStudents([]);
      return;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (!saved) {
      setStudents([]);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setStudents(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error('Erreur lecture élèves', e);
      setStudents([]);
    }
  }, [storageKey]);

  // Charger tous les paiements de la classe courante
  useEffect(() => {
    if (!paymentsKey) {
      setPaymentsMap({});
      return;
    }
    const raw = typeof window !== 'undefined' ? localStorage.getItem(paymentsKey) : null;
    if (!raw) {
      setPaymentsMap({});
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setPaymentsMap(parsed && typeof parsed === 'object' ? parsed : {});
    } catch (e) {
      console.error('Erreur lecture paiements', e);
      setPaymentsMap({});
    }
  }, [paymentsKey]);

  // Détermine le premier mois payable en fonction de la date d'inscription
  const getStartMonth = (inscription) => {
    if (!inscription) return 9; // Septembre par défaut
    const d = new Date(inscription);
    if (Number.isNaN(d.getTime())) return 9;
    let m = d.getMonth() + 1; // 1-12
    const day = d.getDate();
    // Règle: si inscrit après le 20, on commence le mois suivant
    if (day > 20) {
      m += 1;
      if (m > 12) m = 1;
    }
    return m;
  };

  // Paiements utilitaires (lecture seule sur la donnée legacy)
  const getStudentMonthPayment = (studentId, monthKey) => {
    const entry = paymentsMap?.[studentId]?.[monthKey];
    if (!entry) return { amount: 0, date: null };
    if (typeof entry === 'number') return { amount: entry, date: null };
    return {
      amount: Number(entry.amount) || 0,
      date: entry.date || entry.timestamp || null,
    };
  };

  const getStudentFPayment = (studentId, fKey) => {
    const entry = paymentsMap?.[studentId]?.[fKey];
    if (!entry) return { amount: 0, date: null };
    if (typeof entry === 'number') return { amount: entry, date: null };
    return {
      amount: Number(entry.amount) || 0,
      date: entry.date || entry.timestamp || null,
    };
  };

  const mapMonthIndex = (monthNum) => {
    // monthNum: 9..12 or 1..6 => index 0..9
    return monthNum >= 9 ? monthNum - 9 : monthNum + 3;
  };

  const calculateDebt = (stu, schoolYear) => {
    const startMonth = getStartMonth(stu.inscription);
    let due = 0;
    let paid = 0;
    
    // Calculer pour chaque mois
    monthDefs.forEach(({ key, num }) => {
      const mp = getStudentMonthPayment(stu.rowId, key);
      const total = mp.amount || 0;
      
      if (isMonthPayable(num, startMonth)) {
        const y = num >= 9 ? schoolYear : schoolYear + 1;
        const dueDate = new Date(y, num, 5);
        if (new Date() >= dueDate) {
          due += monthlyFee;
        }
      }
      paid += total;
    });
    
    // F (9000 chacun)
    F_KEYS.forEach(f => {
      due += 9000;
      const fp = getStudentFPayment(stu.rowId, f);
      paid += fp.amount || 0;
    });
    
    return Math.max(0, due - paid);
  };

  const isMonthPayable = (monthNum, startMonth) => {
    const idx = mapMonthIndex(monthNum);
    const startIdx = mapMonthIndex(startMonth);
    return idx >= startIdx;
  };

  const normalizedStudents = students.map((stu, idx) => {
    const fullName = [stu.nom, stu.postnom, stu.prenom].filter(Boolean).join(' ').trim() || stu.name || '';
    const startMonth = getStartMonth(stu.inscription);
    return {
      ...stu,
      rowId: stu.id || `${idx + 1}`,
      matricule: stu.matricule || '',
      fullName,
      inscription: stu.inscription || '',
      startMonth,
    };
  });

  // Calculer total payé pour tri
  const getStudentTotalPaid = (stu) => {
    let total = 0;
    monthDefs.forEach(({ key }) => {
      const mp = getStudentMonthPayment(stu.rowId, key);
      total += mp.amount || 0;
    });
    F_KEYS.forEach(f => {
      const fp = getStudentFPayment(stu.rowId, f);
      total += fp.amount || 0;
    });
    return total;
  };

  const sortedStudents = [...normalizedStudents].sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    if (sortBy === 'payment') {
      return getStudentTotalPaid(b) - getStudentTotalPaid(a);
    }
    return 0;
  });

  const classLabel = selectedClass ? `${selectedClass.sectionName || ''} — ${selectedClass.className || ''}` : 'Aucune classe sélectionnée';
  const schoolYear = useMemo(() => {
    const now = new Date();
    return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  }, []);

  if (!selectedClass) {
    return (
      <div className="financial-situation" style={{ padding: '12px' }}>
        <div className="header">
          <div className="header-left">
            <h1>Situation financière</h1>
          </div>
        </div>
        <div style={{ padding: '12px', background: '#212121', borderRadius: '6px' }}>
          Sélectionnez d'abord une classe depuis l'accueil, puis cliquez "Situation financière" dans la page classe.
        </div>
      </div>
    );
  }

  return (
    <div className="financial-situation">
      <div className="header">
        <div className="header-left">
          <h1>Situation financière — {classLabel}</h1>
          <button
            type="button"
            onClick={onBack}
            style={{color: '#e3f2fd', background:'transparent', border:'1px solid #e3f2fd', borderRadius:'4px', padding:'2px 6px', cursor:'pointer', fontSize:'0.7rem'}}>
            ← Retour
          </button>
        </div>
        <div className="header-right">
          <span className="fee-display">Frais mensuel: <strong>{monthlyFee.toLocaleString('fr-FR')} CDF</strong></span>
          <button className="action-btn btn-sort" onClick={() => setSortBy(sortBy === 'name' ? 'payment' : 'name')}>
            📊 Trier par {sortBy === 'name' ? 'paiement' : 'nom'}
          </button>          <button 
            className="action-btn btn-pdf" 
            onClick={() => exportFinancialSituationPDF(
              selectedClass.className, 
              selectedClass.sectionName, 
              normalizedStudents, 
              paymentsMap
            )}
            style={{background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
          >
            📄 Télécharger PDF
          </button>        </div>
      </div>

      <div className="legend">
        <span><span className="legend-box paid"></span> Payé</span>
        <span><span className="legend-box partial"></span> Partiel</span>
        <span><span className="legend-box unpaid"></span> Impayé</span>
        <span><span className="legend-box not-due"></span> Non dû</span>
        <span><span className="debt-indicator">⚠</span> Dette en cours</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width: '30px'}}>N°</th>
              <th style={{width: '70px'}}>MATRICULE</th>
              <th style={{minWidth: '130px'}}>NOM COMPLET</th>
              {monthDefs.map(({ label }, i) => (
                <th key={i} style={{width: '52px', maxWidth: '52px'}}>{label}</th>
              ))}
              <th style={{width: '48px', background: '#9b59b6'}}>F1</th>
              <th style={{width: '48px', background: '#9b59b6'}}>F2</th>
              <th style={{width: '48px', background: '#9b59b6'}}>F3</th>
              <th style={{width: '75px'}}>DETTE</th>
              <th style={{width: '75px'}}>PAYÉ</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan={monthDefs.length + 7} style={{ textAlign:'center', padding:'12px' }}>
                  Aucun élève trouvé pour {classLabel}. Ajoutez des élèves puis revenez sur cette page.
                </td>
              </tr>
            )}
            {sortedStudents.map((stu, idx) => {
              const debt = calculateDebt(stu, schoolYear);
              const totalPaid = getStudentTotalPaid(stu);
              
              return (
                <tr key={stu.rowId}>
                  <td>{idx + 1}</td>
                  <td>{stu.matricule}</td>
                  <td>{stu.fullName}</td>
                  {monthDefs.map(({ key, num }, i) => {
                    const mp = getStudentMonthPayment(stu.rowId, key);
                    const amtTotal = mp.amount || 0;
                    const payable = isMonthPayable(num, stu.startMonth);
                    const y = num >= 9 ? schoolYear : schoolYear + 1;
                    const dueDate = new Date(y, num, 5);
                    const isDue = new Date() >= dueDate;
                    let cellClass = 'not-due';
                    if (!payable) {
                      cellClass = 'not-due';
                    } else if (amtTotal >= monthlyFee) {
                      cellClass = 'paid';
                    } else if (amtTotal > 0) {
                      cellClass = 'partial';
                    } else if (isDue) {
                      cellClass = 'unpaid';
                    }
                    const displayText = amtTotal > 0 ? `${amtTotal.toLocaleString('fr-FR')}${mp.date ? '\n' + new Date(mp.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}) : ''}` : '-';
                    return (
                      <td key={i} className={`payment-cell ${cellClass}`} title="Lecture seule (legacy)">
                        {displayText}
                      </td>
                    );
                  })}
                  {F_KEYS.map(f => {
                    const fp = getStudentFPayment(stu.rowId, f);
                    const amtTotal = fp.amount || 0;
                    const cellClass = amtTotal >= 9000 ? 'paid' : amtTotal > 0 ? 'partial' : 'unpaid';
                    const displayText = amtTotal > 0 ? `${amtTotal.toLocaleString('fr-FR')}${fp.date ? '\n' + new Date(fp.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}) : ''}` : '-';
                    return (
                      <td key={f} className={`payment-cell ${cellClass}`} title="Lecture seule (legacy)">
                        {displayText}
                      </td>
                    );
                  })}
                  <td className={`debt-cell ${debt > 0 ? 'has-debt' : ''}`}>
                    {debt > 0 ? <span className="debt-indicator">⚠ {debt.toLocaleString('fr-FR')}</span> : '0'}
                  </td>
                  <td className="total-cell">
                    {totalPaid.toLocaleString('fr-FR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
