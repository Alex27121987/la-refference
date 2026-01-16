import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Paiement() {
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        delete window.PDF_CONTEXT;
      }
    };
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const eleve = location.state?.eleve;
  const classe = location.state?.classe;

  // 🔒 Sécurité : accès sans élève
  if (!eleve || !classe) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#fff",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: 32,
            background: "#1e293b",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <h2>❌ Accès refusé</h2>
          <p>
            Aucun élève ou classe sélectionné.
            <br />
            Veuillez revenir à la liste et sélectionner un élève.
          </p>
        </div>
      </div>
    );
  }

  const [typePaiement, setTypePaiement] = useState("");
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");

  // 💾 Enregistrement local
  const enregistrerPaiement = () => {
    if (!typePaiement || !montant) {
      setMessage("⚠️ Veuillez renseigner le type et le montant.");
      return;
    }

    const paiement = {
      id: Date.now(),
      eleve,
      classe,
      type: typePaiement,
      montant: Number(montant),
      date: new Date().toLocaleString(),
    };

    const data = JSON.parse(localStorage.getItem("paiements") || "[]");
    data.push(paiement);
    localStorage.setItem("paiements", JSON.stringify(data));

    setMontant("");
    setTypePaiement("");
    setMessage("✅ Paiement enregistré avec succès.");

    // Confirmation impression reçu (clavier + souris)
    setTimeout(() => {
      const confirmPrint = window.confirm("Voulez-vous imprimer le reçu ? (Entrée = Oui / Échap = Non)");
      if (confirmPrint) {
        window.PDF_CONTEXT = {
          type: "recu-paiement",
          data: { paiement },
        };
      }
    }, 300);
  };

  // Affectation du contexte PDF UNIQUEMENT dans un useEffect
  useEffect(() => {
    const paiements = JSON.parse(localStorage.getItem("paiements") || "[]")
      .filter((p) => p.eleve.matricule === eleve.matricule)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    window.PDF_CONTEXT = {
      type: "paiement",
      data: {
        paiement: paiements[0] || null,
      },
    };
    return () => {
      delete window.PDF_CONTEXT;
    };
  }, [eleve, classe]);

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <h1 style={styles.title}>Paiement – Classe : {classe}</h1>

      {/* 👤 Élève */}
      <div style={styles.eleveBox}>
        <strong>
          {eleve.nom} {eleve.postnom} {eleve.prenom}
        </strong>
        <div>Matricule : {eleve.matricule}</div>
      </div>

      {/* 💳 Formulaire */}
      <div style={styles.card}>
        <select
          value={typePaiement}
          onChange={(e) => setTypePaiement(e.target.value)}
          style={styles.input}
        >
          <option value="">-- Type de paiement --</option>
          <option value="Frais mensuel">Frais mensuel</option>
          <option value="Frais de l’État">Frais de l’État</option>
          <option value="Autre">Autre</option>
        </select>

        <input
          type="number"
          placeholder="Montant"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          style={styles.input}
        />

        <button style={styles.primaryBtn} onClick={enregistrerPaiement}>
          Valider le paiement
        </button>

        {message && <div style={styles.message}>{message}</div>}
      </div>

      {/* 📊 Historique */}
      <div style={styles.history}>
        <h3>📊 Historique des paiements</h3>
        {JSON.parse(localStorage.getItem("paiements") || "[]")
          .filter((p) => p.eleve.matricule === eleve.matricule)
          .reverse()
          .map((p) => (
            <div key={p.id} style={styles.historyItem}>
              <span>{p.date}</span>
              <span>{p.type}</span>
              <strong>{p.montant} FC</strong>
            </div>
          ))}
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    padding: "20px 40px",
  },

  title: {
    textAlign: "center",
    marginBottom: 10,
  },

  backBtn: {
    background: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: 6,
    cursor: "pointer",
  },

  eleveBox: {
    textAlign: "center",
    marginBottom: 10,
    opacity: 0.9,
  },

  card: {
    maxWidth: 460,
    margin: "0 auto",
    marginTop: -10,
    background: "#fff",
    color: "#111",
    padding: 24,
    borderRadius: 10,
    boxShadow: "0 10px 30px rgba(0,0,0,.3)",
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 15,
  },

  primaryBtn: {
    width: "100%",
    background: "#2563eb",
    border: "none",
    color: "#fff",
    padding: 12,
    borderRadius: 6,
    fontSize: 15,
    cursor: "pointer",
    fontWeight: 600,
  },

  message: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: 500,
  },

  history: {
    maxWidth: 520,
    margin: "20px auto",
  },

  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    background: "#1e293b",
    padding: "8px 12px",
    borderRadius: 6,
    marginBottom: 6,
    fontSize: 14,
  },

  errorBox: {
    background: "#111827",
    padding: 40,
    borderRadius: 10,
    textAlign: "center",
    maxWidth: 420,
    margin: "100px auto",
  },
};
