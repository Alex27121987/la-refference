import React from 'react';
import { useLocation } from 'react-router-dom';

export default function SituationFinanciere() {
  const location = useLocation();
  const section = location.state?.section;
  const classe = location.state?.classe;

  return (
    <div style={{padding: 32}}>
      <h2>💰 Situation financière</h2>
      <p><strong>Section :</strong> {section}</p>
      <p><strong>Classe :</strong> {classe}</p>
      {/* Affichage de la situation financière à compléter */}
      <div style={{marginTop: 24, color: '#888'}}>Fonctionnalité à compléter : situation financière de la classe.</div>
    </div>
  );
}
