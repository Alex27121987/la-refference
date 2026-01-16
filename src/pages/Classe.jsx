import React from "react";
import { useNavigate, useParams } from 'react-router-dom';

// Source locale des élèves (à remplacer par un import ou localStorage si besoin)
const ELEVES = [
  { matricule: "2023001", nom: "KABAMBA", postnom: "MUTOMBO", prenom: "Jean", adresse: "Av. Kasa-Vubu 12", date: "2023-09-01" },
  { matricule: "2023002", nom: "KALALA", postnom: "KATUMBA", prenom: "Marie", adresse: "Av. Lumumba 8", date: "2023-09-02" },
  { matricule: "2023003", nom: "MUKENDI", postnom: "ILUNGA", prenom: "Paul", adresse: "Av. Sendwe 5", date: "2023-09-03" },
  { matricule: "2023004", nom: "KASONGO", postnom: "KABILA", prenom: "Chantal", adresse: "Av. Kimbangu 22", date: "2023-09-04" },
  { matricule: "2023005", nom: "TSHIBANDA", postnom: "MULUMBA", prenom: "David", adresse: "Av. Libération 3", date: "2023-09-05" },
];

export default function Classe() {
  const navigate = useNavigate();
  const { classe } = useParams();
  const [search, setSearch] = React.useState("");
  const [selectedMatricules, setSelectedMatricules] = React.useState([]);
  const lastSelectedIndex = React.useRef(null);

  // Garde : classe param obligatoire et valide
  if (!classe || classe === "situation" || classe === "undefined") {
    return (
      <div style={{ padding: 32, color: '#b91c1c', fontWeight: 600 }}>
        Erreur : classe invalide ou non spécifiée.<br />
        <button style={{ marginTop: 16 }} onClick={() => navigate("/")}>Retour à l’accueil</button>
      </div>
    );
  }

  // Filtrage des élèves
  const filteredEleves = ELEVES.filter(eleve => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      eleve.nom.toLowerCase().includes(q) ||
      eleve.postnom.toLowerCase().includes(q) ||
      eleve.prenom.toLowerCase().includes(q)
    );
  });

  // Handler pour Paiement (désactivé si plusieurs élèves)
  function navigateToPaiement() {
    if (selectedMatricules.length !== 1) return;
    const eleve = ELEVES.find(eleve => selectedMatricules.includes(eleve.matricule));
    if (!eleve) return;
    navigate('/paiement', {
      state: {
        classe: classe,
        eleve: eleve
      }
    });
  }

  // PDF_CONTEXT (type reconnu par pdfExport.js)
  React.useEffect(() => {
    if (typeof window !== "undefined" && classe && classe !== "situation" && classe !== "undefined") {
      window.PDF_CONTEXT = {
        type: "liste-classe",
        data: {
          classe,
          eleves: ELEVES,
        },
      };
      return () => {
        delete window.PDF_CONTEXT;
      };
    }
  }, [classe]);

  return (
    <>
      <div style={{ minHeight: "100vh", background: "#e5e7eb", padding: 0, margin: 0 }}>
        <div style={{ maxWidth: 950, margin: "0 auto", paddingTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
            <button
              style={{
                background: "none",
                border: "1px solid #cbd5e1",
                borderRadius: 4,
                color: "#2563eb",
                fontWeight: 500,
                fontSize: 16,
                padding: "6px 18px 6px 12px",
                marginRight: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              onClick={() => navigate("/")}
            >
              <span style={{ fontSize: 18, marginRight: 6 }}>←</span> Retour
            </button>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: "#222", margin: 0, letterSpacing: 0.5 }}>Classe : {classe}</h2>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un élève..."
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 5,
                padding: '7px 14px',
                fontSize: 14,
                width: 260,
                background: '#f6f7fa',
                color: '#222',
                outline: 'none',
                boxShadow: 'none',
                fontWeight: 400,
                transition: 'border 0.2s',
                marginRight: 0
              }}
              aria-label="Rechercher un élève"
            />
          </div>
          {selectedMatricules.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              background: '#f6f7fa',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '10px 22px',
              marginBottom: 14,
              boxShadow: '0 2px 8px #e5e7eb',
              fontSize: 15,
              fontWeight: 500,
              color: '#223',
              justifyContent: 'flex-start'
            }}>
              <span style={{ fontWeight: 600, color: '#2563eb', marginRight: 8 }}>
                {selectedMatricules.length} élève{selectedMatricules.length > 1 ? 's' : ''} sélectionné{selectedMatricules.length > 1 ? 's' : ''}
              </span>
              <button
                style={{
                  background: selectedMatricules.length === 1 ? '#2563eb' : '#e5e7eb',
                  border: 'none',
                  borderRadius: 4,
                  color: selectedMatricules.length === 1 ? '#fff' : '#888',
                  fontWeight: 500,
                  fontSize: 15,
                  padding: '7px 18px',
                  cursor: selectedMatricules.length === 1 ? 'pointer' : 'not-allowed',
                  opacity: selectedMatricules.length === 1 ? 1 : 0.7,
                  boxShadow: selectedMatricules.length === 1 ? '0 1px 4px #e5e7eb' : 'none',
                  marginRight: 0
                }}
                disabled={selectedMatricules.length !== 1}
                onClick={selectedMatricules.length === 1 ? navigateToPaiement : undefined}
              >Paiement</button>
              <button style={{
                background: '#e5e7eb', border: 'none', borderRadius: 4, color: '#888', fontWeight: 500, fontSize: 15, padding: '7px 18px', cursor: 'not-allowed', opacity: 0.7
              }} disabled>Exporter</button>
              <button style={{
                background: '#e5e7eb', border: 'none', borderRadius: 4, color: '#888', fontWeight: 500, fontSize: 15, padding: '7px 18px', cursor: 'not-allowed', opacity: 0.7
              }} disabled>Détails</button>
              <button style={{
                background: '#2563eb', border: 'none', borderRadius: 4, color: '#fff', fontWeight: 500, fontSize: 15, padding: '7px 18px', cursor: 'pointer', marginLeft: 8, boxShadow: '0 1px 4px #e5e7eb', transition: 'background 0.15s'
              }} onClick={() => setSelectedMatricules([])}>Annuler la sélection</button>
            </div>
          )}
          <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 7, padding: 0, overflowX: "auto", boxShadow: '0 2px 8px #e5e7eb' }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.2, background: "#fff", minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#f6f7fa", height: 34 }}>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'left', padding: '6px 7px' }}>Matricule</th>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'left', padding: '6px 7px' }}>Nom</th>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'left', padding: '6px 7px' }}>Postnom</th>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'left', padding: '6px 7px' }}>Prénom</th>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'left', padding: '6px 7px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Adresse</th>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'center', padding: '6px 7px', width: 110 }}>Date d’inscription</th>
                  <th style={{ ...thStyle, fontWeight: 700, fontSize: 13, letterSpacing: 0.1, color: '#223', textAlign: 'center', padding: '6px 7px', width: 70 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEleves.map((el, idx) => {
                  const isSelected = selectedMatricules.includes(el.matricule);
                  const handleRowClick = (e) => {
                    if (e.ctrlKey || e.metaKey) {
                      // CTRL: toggle selection
                      setSelectedMatricules(prev =>
                        prev.includes(el.matricule)
                          ? prev.filter(m => m !== el.matricule)
                          : [...prev, el.matricule]
                      );
                      lastSelectedIndex.current = idx;
                    } else if (e.shiftKey && lastSelectedIndex.current !== null) {
                      // SHIFT: select range
                      const start = Math.min(lastSelectedIndex.current, idx);
                      const end = Math.max(lastSelectedIndex.current, idx);
                      const range = filteredEleves.slice(start, end + 1).map(eleve => eleve.matricule);
                      setSelectedMatricules(prev => Array.from(new Set([...prev, ...range])));
                    } else {
                      // Simple click: single selection
                      setSelectedMatricules([el.matricule]);
                      lastSelectedIndex.current = idx;
                    }
                  };
                  return (
                    <tr
                      key={el.matricule}
                      onClick={handleRowClick}
                      style={{
                        background: isSelected ? '#dbeafe' : (idx % 2 === 0 ? '#f7f8fa' : '#fff'),
                        height: 30,
                        cursor: 'pointer',
                        borderLeft: isSelected ? '5px solid #2563eb' : '4px solid transparent',
                        transition: 'background 0.15s, border 0.15s',
                        color: isSelected ? '#173a6a' : '#222',
                        fontWeight: isSelected ? 500 : 400
                      }}
                    >
                      <td style={{ ...tdStyle, fontSize: 13, padding: '4px 7px', color: '#222', textAlign: 'left', fontWeight: 400 }}>{el.matricule}</td>
                      <td style={{ ...tdStyle, fontSize: 13, padding: '4px 7px', color: '#222', textAlign: 'left', fontWeight: 400 }}>{el.nom}</td>
                      <td style={{ ...tdStyle, fontSize: 13, padding: '4px 7px', color: '#222', textAlign: 'left', fontWeight: 400 }}>{el.postnom}</td>
                      <td style={{ ...tdStyle, fontSize: 13, padding: '4px 7px', color: '#222', textAlign: 'left', fontWeight: 400 }}>{el.prenom}</td>
                      <td style={{ ...tdStyle, fontSize: 13, padding: '4px 7px', color: '#222', textAlign: 'left', fontWeight: 400, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.adresse}</td>
                      <td style={{ ...tdStyle, fontSize: 13, padding: '4px 7px', color: '#222', textAlign: 'center', fontWeight: 400, width: 110 }}>{el.date}</td>
                      <td style={{ ...tdStyle, textAlign: "center", padding: '4px 7px', width: 70 }}>
                        <span style={{ color: "#bdbdbd", fontSize: 17, marginRight: 7, cursor: "not-allowed", opacity: 0.7, verticalAlign: 'middle' }} title="Voir">👁️‍🗨️</span>
                        <span style={{ color: "#bdbdbd", fontSize: 16, cursor: "not-allowed", opacity: 0.7, verticalAlign: 'middle' }} title="Modifier">✏️</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const thStyle = {
  padding: "6px 7px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  color: "#223",
  background: "#f6f7fa",
  textAlign: "left",
  fontSize: 13.5,
  letterSpacing: 0.2
};

const tdStyle = {
  padding: "4px 7px",
  borderBottom: "1px solid #f1f1f1",
  color: "#222",
  background: "none",
  fontSize: 13.2
};
