import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Travaux() {
  const location = useLocation();
  const section = location.state?.section;
  const classe = location.state?.classe;

  return (
    <div style={{padding: 32}}>
      <h2>📚 Travaux de la classe</h2>
      <p><strong>Section :</strong> {section}</p>
      <p><strong>Classe :</strong> {classe}</p>
      {/* Gestion des travaux à compléter */}
      <div style={{marginTop: 24, color: '#888'}}>Fonctionnalité à compléter : gestion des travaux de la classe.</div>
    </div>
  );
}
