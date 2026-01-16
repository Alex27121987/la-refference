
import React, { useRef, useState } from 'react';
import { FaArrowDown, FaEdit, FaTrash } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

export default function Eleves() {
  const location = useLocation();
  const section = location.state?.section;
  const classe = location.state?.classe;
  const [eleves, setEleves] = useState([
    { id: 1, nom: 'Kabasele', postnom: 'Mwamba', prenom: 'Jean', dateInscription: '2026-01-10' },
    { id: 2, nom: 'Katumba', postnom: 'Banza', prenom: 'Marie', dateInscription: '2026-01-11' },
  ]);
  const scrollRef = useRef(null);
  // Drag scroll
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const handleDragStart = (e) => {
    setDragging(true);
    setStartY(e.clientY);
  };
  const handleDrag = (e) => {
    if (dragging) {
      window.scrollBy(0, e.clientY - startY);
      setStartY(e.clientY);
    }
  };
  const handleDragEnd = () => setDragging(false);

  return (
    <div style={{padding: 24, maxWidth: 900, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18, justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <span style={{fontSize: 32, marginRight: 12}}>👨‍🎓</span>
          <div style={{textAlign: 'left'}}>
            <div style={{fontSize: 28, fontWeight: 700}}>Élèves de la classe</div>
            <div style={{fontSize: 18, fontWeight: 600}}><strong>Section :</strong> {section}</div>
            <div style={{fontSize: 18, fontWeight: 600}}><strong>Classe :</strong> {classe}</div>
          </div>
        </div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          {/* Boutons de navigation */}
          <button style={navBtnStyle} onClick={() => window.location.href = '/'}>🏠 Accueil</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/classe/situation'}>💰 Situation financière</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/classe/travaux'}>📚 Travaux</button>
          {/* Boutons opérationnels pour la page actuelle */}
          <button style={btnStyle} title="Élèves (page actuelle)" disabled>👨‍🎓</button>
          <button style={btnStyle} title="Documents" onClick={() => window.location.href = '/classe/documents'}>📄</button>
          {/* Icône draggable pour scroll */}
          <span
            ref={scrollRef}
            style={{
              display: 'inline-block',
              width: 32,
              height: 32,
              background: '#222',
              borderRadius: '50%',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '32px',
              cursor: 'grab',
              marginLeft: 8,
              userSelect: 'none',
            }}
            title="Glisser pour monter/descendre"
            onMouseDown={handleDragStart}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <FaArrowDown />
          </span>
        </div>
      </div>
      {/* Liste des élèves */}
      <table style={{width: '100%', marginTop: 24, background: '#222', color: '#fff', borderRadius: 8, overflow: 'hidden'}}>
        <thead>
          <tr style={{background: '#333'}}>
            <th style={{padding: 8}}>N°</th>
            <th style={{padding: 8}}>Nom</th>
            <th style={{padding: 8}}>Postnom</th>
            <th style={{padding: 8}}>Prénom</th>
            <th style={{padding: 8}}>Date inscription</th>
            <th style={{padding: 8}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map((el, idx) => (
            <tr key={el.id} style={{background: idx % 2 ? '#222' : '#282828'}}>
              <td style={{padding: 8}}>{idx + 1}-{el.dateInscription}</td>
              <td style={{padding: 8}}>{el.nom}</td>
              <td style={{padding: 8}}>{el.postnom}</td>
              <td style={{padding: 8}}>{el.prenom}</td>
              <td style={{padding: 8}}>{el.dateInscription}</td>
              <td style={{padding: 8}}>
                <button style={actionBtnStyle} title="Modifier"><FaEdit /></button>
                <button style={actionBtnStyle} title="Supprimer"><FaTrash /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


const actionBtnStyle = {
  background: '#444',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontSize: 16,
  marginRight: 6,
  cursor: 'pointer',
  padding: '4px 8px',
};

const navBtnStyle = {
  padding: '6px 14px',
  fontSize: 16,
  borderRadius: 6,
  border: '1px solid #444',
  background: '#222',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
  marginRight: 4,
  boxShadow: '0 1px 4px #0002',
  transition: 'background 0.2s',
};

