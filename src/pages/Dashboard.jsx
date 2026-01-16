import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Icônes SVG linéaires sobres
const SectionIcons = {
  maternelle: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{marginRight:8}} aria-hidden="true">
      <circle cx="14" cy="14" r="12" stroke="#8A8A8A" strokeWidth="2"/>
      <circle cx="14" cy="13" r="5" stroke="#8A8A8A" strokeWidth="2"/>
      <rect x="9" y="18" width="10" height="4" rx="2" stroke="#8A8A8A" strokeWidth="2"/>
    </svg>
  ),
  primaire: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{marginRight:8}} aria-hidden="true">
      <rect x="4" y="7" width="20" height="14" rx="3" stroke="#8A8A8A" strokeWidth="2"/>
      <rect x="8" y="11" width="12" height="6" rx="1.5" stroke="#8A8A8A" strokeWidth="2"/>
    </svg>
  ),
  secondaire: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{marginRight:8}} aria-hidden="true">
      <rect x="6" y="6" width="16" height="16" rx="4" stroke="#8A8A8A" strokeWidth="2"/>
      <path d="M10 18V10h8v8" stroke="#8A8A8A" strokeWidth="2"/>
    </svg>
  ),
};

const SECTIONS = [
  { id: 'maternelle', name: 'Maternelle', icon: SectionIcons.maternelle, classes: ['Mat1', 'Mat2', 'Mat3'] },
  { id: 'primaire', name: 'Primaire', icon: SectionIcons.primaire, classes: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] },
  { id: 'secondaire', name: 'Secondaire', icon: SectionIcons.secondaire, classes: ['7EB', '8EB', '1S', '2S', '3S', '4S'] },
];

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState({ section: null, classe: null });
  const firstBtnRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { if (firstBtnRef.current) firstBtnRef.current.focus(); }, []);

  // Handler navigation vers la page Classe
  const handleClassClick = (section, classe) => {
    setSelected({ section, classe });
    navigate(`/classe/${classe}`);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.PDF_CONTEXT = {
        type: "rapport-general",
        data: {
          sections: SECTIONS
        }
      };
      return () => {
        delete window.PDF_CONTEXT;
      };
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#d1d5db' }}>
      {/* Menu hamburger */}
      <button
        aria-label="Ouvrir le menu"
        onClick={() => setMenuOpen((v) => !v)}
        style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', color: '#222', fontSize: 32, cursor: 'pointer', zIndex: 10 }}
      >
        <span style={{fontSize: 32, lineHeight: 1}}>☰</span>
      </button>
      {menuOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 220, height: '100vh', background: '#222', color: '#fff', zIndex: 20, padding: 32 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>Menu</div>
          <div style={{ opacity: 0.7 }}>À compléter plus tard…</div>
        </div>
      )}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0003', zIndex: 15 }} />
      )}
      <div style={{ maxWidth: 1400, margin: '0 auto', paddingTop: 12, paddingLeft: 12, paddingRight: 12 }}>
        <h1 style={{ fontWeight: 700, fontSize: 24, color: '#222', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5, lineHeight: 1.1 }}>Gestion Scolaire</h1>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 200 }}>
          {SECTIONS.map((section) => (
            <section key={section.id} style={{
              background: '#f3f4f6',
              border: '1px solid #cbd5e1',
              borderRadius: 3,
              boxShadow: 'none',
              padding: '8px 18px 8px 18px',
              minWidth: 0,
              flex: '1 1 0',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              maxWidth: 420,
              height: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
                {section.icon}
                <span style={{ fontWeight: 500, fontSize: 13, color: '#555', letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 2 }}>{section.name}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginLeft: 0, justifyContent: 'flex-start' }}>
                {section.classes.map((cls, idx) => (
                  <ClassButton
                    key={cls}
                    label={cls}
                    refProp={section.id === SECTIONS[0].id && idx === 0 ? firstBtnRef : null}
                    selected={selected.section === section.id && selected.classe === cls}
                    onSelect={() => handleClassClick(section.id, cls)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// Bouton classe accessible avec états visuels
function ClassButton({ label, refProp, selected, onSelect }) {
  const [isFocused, setFocused] = useState(false);
  const [isHovered, setHovered] = useState(false);

  return (
    <button
      ref={refProp}
      type="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: 54,
        minHeight: 20,
        padding: '2px 10px',
        borderRadius: 3,
        border: selected ? '2px solid #2563eb' : isFocused ? '2px solid #f59e42' : '1px solid #cbd5e1',
        background: selected ? '#e0e7ef' : isHovered ? '#f1f5f9' : '#f6f7fa',
        color: selected ? '#1e3a8a' : '#222',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        outline: isFocused ? '2px solid #f59e42' : 'none',
        transition: 'background 0.15s, border 0.15s, color 0.15s, outline 0.15s',
        textAlign: 'center',
        boxShadow: 'none',
        userSelect: 'none',
        appearance: 'none',
        letterSpacing: 0.2,
      }}
    >
      {label}
    </button>
  );
}
