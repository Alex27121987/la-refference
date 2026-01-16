import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Documents() {
  const location = useLocation();
  const section = location.state?.section || "";
  const classe = location.state?.classe || "";

  /* =======================
     CONTEXTE PDF
  ======================= */
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.PDF_CONTEXT = {
        type: "documents-classe",
        data: {
          section,
          classe,
        },
      };
      return () => {
        delete window.PDF_CONTEXT;
      };
    }
  }, [section, classe]);

  return (
    <div style={container}>
      <h2 style={title}>📄 Documents de la classe</h2>

      <div style={infoBox}>
        <p><strong>Section :</strong> {section || "—"}</p>
        <p><strong>Classe :</strong> {classe || "—"}</p>
      </div>

      <div style={placeholder}>
        📂 Fonctionnalité à compléter :  
        <br />
        import, export, organisation et archivage des documents.
      </div>

      <p style={hint}>
        👉 Clique sur l’icône 📄 en haut pour générer un PDF lié aux documents de cette classe.
      </p>
    </div>
  );
}

/* =======================
   STYLES
======================= */

const container = {
  padding: 32,
  maxWidth: 900,
  margin: "0 auto",
};

const title = {
  marginBottom: 16,
};

const infoBox = {
  background: "#f8fafc",
  padding: 16,
  borderRadius: 8,
  marginBottom: 24,
};

const placeholder = {
  marginTop: 24,
  padding: 20,
  borderRadius: 8,
  background: "#ffffff",
  border: "1px dashed #d1d5db",
  color: "#6b7280",
};

const hint = {
  marginTop: 24,
  fontSize: 14,
  color: "#6b7280",
};
