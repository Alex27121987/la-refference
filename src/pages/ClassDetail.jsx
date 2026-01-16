import { useNavigate, useParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

export default function ClassDetail() {
  const navigate = useNavigate();
  const { classe } = useParams();

  if (!classe) {
    return <div style={{ padding: 32 }}>Aucune classe sélectionnée.</div>;
  }

  /* =======================
     Données élèves
  ======================= */
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const key = `lr_students_${classe}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStudents(Array.isArray(parsed) ? parsed : []);
      } catch {
        setStudents([]);
      }
    }
  }, [classe]);

  /* =======================
     CONTEXTE PDF (IMPORTANT)
  ======================= */
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.PDF_CONTEXT = {
        type: "liste-classe",
        data: {
          classe,
          eleves: students,
        },
      };
      return () => {
        delete window.PDF_CONTEXT;
      };
    }
  }, [classe, students]);

  /* =======================
     Scroll par glissement
  ======================= */
  const scrollRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleDragStart = (e) => {
    setDragging(true);
    setStartY(e.clientY);
  };

  const handleDrag = (e) => {
    if (!dragging) return;
    window.scrollBy(0, e.clientY - startY);
    setStartY(e.clientY);
  };

  const handleDragEnd = () => setDragging(false);

  /* =======================
     Rendu
  ======================= */
  return (
    <div style={container}>
      {/* En-tête */}
      <div style={header}>
        <button onClick={() => navigate("/")} style={navBtn} title="Accueil">
          🏠
        </button>
        <h2 style={{ margin: 0 }}>Classe : {classe}</h2>
      </div>

      {/* Barre d’actions */}
      <div style={actionBar}>
        <button style={btn}>👨‍🎓 Élèves ({students.length})</button>
        <button style={btn} onClick={() => navigate("/paiement")}>
          💰 Paiements
        </button>
        <button style={btn}>📚 Travaux</button>
        <button style={btn}>📄 Documents</button>

        <span
          ref={scrollRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={scrollBtn}
          title="Glisser pour défiler"
        >
          ⏬
        </span>
      </div>

      {/* Liste élèves (aperçu) */}
      <div style={listBox}>
        {students.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Aucun élève enregistré.</p>
        ) : (
          students.map((e, i) => (
            <div key={i} style={studentRow}>
              <strong>{e.nom} {e.postnom} {e.prenom}</strong>
              <span>Matricule : {e.matricule}</span>
            </div>
          ))
        )}
      </div>

      <p style={helpText}>
        👉 Clique sur l’icône 📄 en haut pour générer le PDF de la classe.
      </p>
    </div>
  );
}

/* =======================
   STYLES
======================= */

const container = {
  padding: 24,
  maxWidth: 1000,
  margin: "0 auto",
};

const header = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 20,
};

const navBtn = {
  background: "none",
  border: "none",
  fontSize: 20,
  cursor: "pointer",
};

const actionBar = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  background: "#f8fafc",
  padding: 14,
  borderRadius: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const btn = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const scrollBtn = {
  width: 32,
  height: 32,
  background: "#111827",
  color: "#ffffff",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "grab",
  userSelect: "none",
};

const listBox = {
  marginTop: 20,
  background: "#ffffff",
  padding: 16,
  borderRadius: 8,
};

const studentRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 14,
};

const helpText = {
  marginTop: 24,
  color: "#6b7280",
  fontSize: 14,
};
