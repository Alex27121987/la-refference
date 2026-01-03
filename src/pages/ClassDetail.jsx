import { useEffect, useMemo, useState, useRef } from 'react';
import './ClassDetail.css';
import { exportClassStudentsPDF } from '../utils/pdfExport';
import { hasPermission, PERMISSIONS } from '../utils/userManagement';

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

export default function ClassDetail({ sectionName, className, onBack, onOpenSituation, user }) {
  const canAddStudents = hasPermission(user, PERMISSIONS.ADD_STUDENTS);
  const canEditStudents = hasPermission(user, PERMISSIONS.EDIT_STUDENTS);
  const canDeleteStudents = hasPermission(user, PERMISSIONS.DELETE_STUDENTS);
  const canImportStudents = hasPermission(user, PERMISSIONS.IMPORT_STUDENTS);
  const canExportPDF = hasPermission(user, PERMISSIONS.EXPORT_PDF);
  const isReadOnly = !canAddStudents && !canEditStudents && !canDeleteStudents;
  
  const breadcrumb = `${sectionName || 'Section'} — ${className || 'Classe'}`;
  const storageKey = useMemo(
    () => {
      const key = normalizeStorageKey(sectionName, className);
      // console.log('[ClassDetail] Storage key:', key, '| Section:', sectionName, '| Classe:', className);
      return key;
    },
    [sectionName, className]
  );
  const [students, setStudents] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({
    nom: '',
    postnom: '',
    prenom: '',
    naissance: '',
    sexe: '',
    inscription: '',
    adresse: '',
    tel: '',
  });
  const [errors, setErrors] = useState({});
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(students));
  }, [students, storageKey]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleDeleteStudent = (id) => {
    if (!canDeleteStudents) {
      setInfo('❌ Vous n\'avez pas la permission de supprimer des élèves');
      setTimeout(() => setInfo(''), 3000);
      return;
    }
    const target = students.find((s) => s.id === id);
    const name = target ? `${target.nom} ${target.postnom}`.trim() : 'cet élève';
    const ok = window.confirm(`Supprimer définitivement ${name} ?`);
    if (!ok) {
      setInfo('Suppression annulée');
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setInfo('Élève supprimé');
  };

  const handleSave = () => {
    if (!canAddStudents) {
      setInfo('❌ Vous n\'avez pas la permission d\'ajouter des élèves');
      setTimeout(() => setInfo(''), 3000);
      return;
    }
    const required = ['nom', 'inscription'];
    const newErrors = required.reduce((acc, field) => {
      if (!form[field]?.trim()) acc[field] = true;
      return acc;
    }, {});

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setInfo('Veuillez remplir les champs obligatoires (Nom, Inscription)');
      return;
    }

    const nextId = students.length ? Math.max(...students.map((s) => s.id)) + 1 : 1;
    const newStudent = {
      id: nextId,
      matricule: `AUTO-${String(nextId).padStart(3, '0')}`,
      nom: form.nom,
      postnom: form.postnom,
      prenom: form.prenom,
      naissance: form.naissance,
      sexe: form.sexe,
      tel: form.tel,
      adresse: form.adresse,
      inscription: form.inscription || '',
    };

    setStudents((prev) => [...prev, newStudent]);
    setForm({ nom: '', postnom: '', prenom: '', naissance: '', sexe: '', inscription: '', adresse: '', tel: '' });
    setErrors({});
    setInfo('Élève ajouté et enregistré');
  };

  const handleCancel = () => {
    setForm({ nom: '', postnom: '', prenom: '', naissance: '', sexe: '', inscription: '', adresse: '', tel: '' });
    setErrors({});
    setInfo('Formulaire réinitialisé (liste inchangée)');
  };

  // Parser CSV et importer les élèves
  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canImportStudents) {
      setImportMessage('❌ Vous n\'avez pas la permission d\'importer des élèves');
      setTimeout(() => setImportMessage(''), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 2) {
        setImportMessage('❌ Fichier vide ou invalide');
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      // Parser l'en-tête
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const nomIndex = headers.indexOf('nom');
      const prenomIndex = headers.indexOf('prenom');
      const matriculeIndex = headers.indexOf('matricule');
      const postnomIndex = headers.indexOf('postnom');
      const naissanceIndex = headers.indexOf('naissance');
      const sexeIndex = headers.indexOf('sexe');
      const telIndex = headers.indexOf('telephone') !== -1 ? headers.indexOf('telephone') : headers.indexOf('tel');
      const adresseIndex = headers.indexOf('adresse');
      const inscriptionIndex = headers.indexOf('inscription');

      if (nomIndex === -1) {
        setImportMessage('❌ Colonne "nom" manquante');
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      // Parser les données
      const newStudents = [];
      const errors = [];
      let nextId = students.length ? Math.max(...students.map(s => s.id)) + 1 : 1;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // Vérifier la ligne n'est pas vide
        if (!values.some(v => v)) continue;

        const nom = values[nomIndex]?.trim();
        if (!nom) {
          errors.push(`Ligne ${i + 1}: Nom manquant`);
          continue;
        }

        const student = {
          id: nextId++,
          nom: nom,
          postnom: values[postnomIndex]?.trim() || '',
          prenom: values[prenomIndex]?.trim() || '',
          matricule: values[matriculeIndex]?.trim() || `AUTO-${String(nextId - 1).padStart(3, '0')}`,
          naissance: values[naissanceIndex]?.trim() || '',
          sexe: values[sexeIndex]?.trim() || '',
          tel: values[telIndex]?.trim() || '',
          adresse: values[adresseIndex]?.trim() || '',
          inscription: values[inscriptionIndex]?.trim() || new Date().toISOString().split('T')[0],
        };

        newStudents.push(student);
      }

      if (newStudents.length === 0) {
        setImportMessage('❌ Aucun élève valide trouvé');
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      // Ajouter les élèves
      setStudents(prev => [...prev, ...newStudents]);
      
      let message = `✅ ${newStudents.length} élève${newStudents.length > 1 ? 's' : ''} importé${newStudents.length > 1 ? 's' : ''}`;
      if (errors.length > 0) {
        message += ` (${errors.length} ligne${errors.length > 1 ? 's' : ''} ignorée${errors.length > 1 ? 's' : ''})`;
      }
      setImportMessage(message);
      setTimeout(() => setImportMessage(''), 4000);

      // Réinitialiser l'input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setImportMessage('❌ Erreur lors du traitement du fichier: ' + err.message);
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  return (
    <div className="class-detail-page">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <span className="breadcrumb">{breadcrumb}</span>
        <div className="top-actions">
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv,.txt" 
            onChange={handleCSVImport}
            style={{ display: 'none' }}
            disabled={!canImportStudents}
          />
          {canImportStudents && (
            <button className="pill" onClick={() => fileInputRef.current?.click()}>📥 Importer CSV</button>
          )}
          {canExportPDF && (
            <button className="pill" onClick={() => exportClassStudentsPDF(className, sectionName, students)}>📄 Télécharger PDF</button>
          )}
          <button className="pill" onClick={onOpenSituation}>📄 Situation financière</button>
          {canAddStudents && (
            <>
              <button className="pill">💸 Paiement rapide</button>
              <button className="pill cancel" onClick={handleCancel}>✖ Annuler</button>
              <button className="pill primary" onClick={handleSave}>💾 Enregistrer</button>
            </>
          )}
        </div>
      </div>

      {info && <div className="info-banner">{info}</div>}
      {isReadOnly && (
        <div style={{
          padding: '15px 20px',
          margin: '10px 20px',
          borderRadius: '6px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          fontSize: '14px',
          fontWeight: '500',
          border: '1px solid #ffeaa7'
        }}>
          👁️ <strong>Mode lecture seule</strong> - Vous pouvez consulter les données mais pas les modifier
        </div>
      )}
      {importMessage && (
        <div style={{
          padding: '12px 20px',
          margin: '10px 20px',
          borderRadius: '6px',
          backgroundColor: importMessage.startsWith('✅') ? '#d4edda' : '#f8d7da',
          color: importMessage.startsWith('✅') ? '#155724' : '#721c24',
          fontSize: '14px',
          fontWeight: '500',
          border: `1px solid ${importMessage.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {importMessage}
        </div>
      )}

      <div className="filters">
        <div className="field"><label>Section:</label><input value={sectionName || ''} readOnly /></div>
        <div className="field"><label>Classe:</label><input value={className || ''} readOnly /></div>
        <div className="field"><label>Mat:</label><input placeholder="Auto" readOnly /></div>
        <div className="field"><label>Nom *</label><input value={form.nom} onChange={(e) => handleChange('nom', e.target.value)} className={errors.nom ? 'error' : ''} disabled={isReadOnly} /></div>
        <div className="field"><label>Post-nom</label><input value={form.postnom} onChange={(e) => handleChange('postnom', e.target.value)} disabled={isReadOnly} /></div>
        <div className="field"><label>Prénom</label><input value={form.prenom} onChange={(e) => handleChange('prenom', e.target.value)} disabled={isReadOnly} /></div>
        <div className="field"><label>Naissance:</label><input value={form.naissance} onChange={(e) => handleChange('naissance', e.target.value)} placeholder="jj / mm / aaaa" disabled={isReadOnly} /></div>
        <div className="field"><label>Sexe:</label><input value={form.sexe} onChange={(e) => handleChange('sexe', e.target.value)} placeholder="--" disabled={isReadOnly} /></div>
        <div className="field"><label>Inscription *</label><input type="date" className={`date-input ${errors.inscription ? 'error' : ''}`} value={form.inscription} onChange={(e) => handleChange('inscription', e.target.value)} disabled={isReadOnly} /></div>
        <div className="field"><label>Téléphone:</label><input value={form.tel} onChange={(e) => handleChange('tel', e.target.value)} placeholder="" disabled={isReadOnly} /></div>
        <div className="field"><label>Adresse:</label><input value={form.adresse} onChange={(e) => handleChange('adresse', e.target.value)} placeholder="" disabled={isReadOnly} /></div>
      </div>

      <div className="table-card">
        <div className="table-title">Liste des élèves — {className || ''}</div>
        <div className="table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Post-nom</th>
                <th>Prénom</th>
                <th>Naissance</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id}>
                  <td>{idx + 1}</td>
                  <td>{s.matricule}</td>
                  <td>{s.nom}</td>
                  <td>{s.postnom}</td>
                  <td>{s.prenom}</td>
                  <td>{s.naissance}</td>
                  <td>{s.tel}</td>
                  <td>{s.adresse}</td>
                  <td className="actions">
                    {canEditStudents && (
                      <button className="action-btn edit" onClick={() => setInfo('Edition non encore implémentée')}>✏️</button>
                    )}
                    {canDeleteStudents && (
                      <button className="action-btn delete" onClick={() => handleDeleteStudent(s.id)}>🗑️</button>
                    )}
                    {!canEditStudents && !canDeleteStudents && <span style={{opacity: 0.5}}>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
