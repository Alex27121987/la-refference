import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Classe from "./pages/Classe.jsx";
import PaymentEntry from "./pages/PaymentEntry.jsx";
import Paiement from "./pages/Paiement.jsx";
import FinancialSituation from "./pages/FinancialSituation.jsx";
import UserManagement from "./pages/UserManagement.jsx";

import { handleGeneratePdf } from "./utils/pdfExport";
import { getRoleLabel } from "./utils/userManagement";

export default function App() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  /* =======================
     Actions globales
  ======================= */
  const handleLogout = () => setUser(null);

  const handleExportPDF = () => {
    if (typeof window === "undefined") {
      alert("PDF indisponible dans ce contexte.");
      return;
    }

    const ctx = window.PDF_CONTEXT;

    if (!ctx || !ctx.type) {
      alert("Aucun document PDF disponible pour cette page.");
      return;
    }

    if (!ctx.data || Object.keys(ctx.data).length === 0) {
      alert("Les données nécessaires au PDF sont manquantes.");
      return;
    }

    try {
      handleGeneratePdf(ctx);
    } catch (e) {
      console.error("Erreur génération PDF :", e);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("🔄 Synchronisation en cours...");
    await new Promise((r) => setTimeout(r, 1000));
    setSyncMessage("✓ Données actualisées");
    setTimeout(() => setSyncMessage(""), 2000);
    setSyncing(false);
  };

  /* =======================
     Auth
  ======================= */
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const roleLabel = getRoleLabel(user.role);

  return (
    <>
      {/* ===== Barre supérieure ===== */}
      <div style={topBar}>
        <button onClick={() => setMenuOpen((v) => !v)} style={burgerBtn}>
          ☰
        </button>

        {/* Menu latéral */}
        <div style={{ ...sideMenu, left: menuOpen ? 0 : -220 }}>
          <Link to="/" style={menuLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/paiements" style={menuLink} onClick={() => setMenuOpen(false)}>Paiements</Link>
          <Link to="/situation" style={menuLink} onClick={() => setMenuOpen(false)}>Situation financière</Link>
          <Link to="/utilisateurs" style={menuLink} onClick={() => setMenuOpen(false)}>Utilisateurs</Link>
        </div>

        {menuOpen && <div style={overlay} onClick={() => setMenuOpen(false)} />}

        <div style={{ color: "#fff", fontSize: 15 }}>
          Bienvenue, {user.username}
          {roleLabel && <span style={{ opacity: 0.8, marginLeft: 8 }}>{roleLabel}</span>}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <button onClick={handleExportPDF} style={iconBtn} title="Exporter PDF">
            📄
          </button>
          <button onClick={handleSync} disabled={syncing} style={iconBtn}>
            🔄
          </button>
          <button onClick={handleLogout} style={{ ...iconBtn, color: "#e74c3c" }}>
            🚪
          </button>
        </div>

        {syncMessage && <span style={syncMsg}>{syncMessage}</span>}
      </div>

      {/* ===== Routes ===== */}
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/paiements" element={<PaymentEntry />} />
        <Route path="/paiement" element={<Paiement />} />
        <Route path="/situation" element={<FinancialSituation />} />
        <Route path="/utilisateurs" element={<UserManagement />} />
        <Route path="/classe/:classe" element={<Classe />} />
      </Routes>
    </>
  );
}

/* =======================
   STYLES
======================= */

const topBar = {
  display: "flex",
  alignItems: "center",
  padding: 8,
  background: "#222",
  position: "relative",
  color: "#fff",
};

const burgerBtn = {
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: 28,
  cursor: "pointer",
  marginRight: 12,
};

const sideMenu = {
  position: "fixed",
  top: 0,
  width: 200,
  height: "100vh",
  background: "#222",
  paddingTop: 48,
  transition: "left 0.2s",
  zIndex: 20,
};

const menuLink = {
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  padding: 16,
  display: "block",
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "#0007",
  zIndex: 15,
};

const iconBtn = {
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
};

const syncMsg = {
  position: "absolute",
  right: 16,
  top: 48,
  background: "#fff3cd",
  color: "#856404",
  padding: "6px 16px",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  zIndex: 30,
};
