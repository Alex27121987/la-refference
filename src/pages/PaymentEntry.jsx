import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PaymentEntry() {
	const location = useLocation();
	const eleves = location.state?.eleves || [];
	const classe = location.state?.classe || '';
	const [montant, setMontant] = React.useState('');
	const [motif, setMotif] = React.useState('');

	// Affichage si aucun élève n'est fourni
	if (!Array.isArray(eleves) || eleves.length === 0) {
		return (
			<div style={{ maxWidth: 420, margin: '48px auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px #e5e7eb', padding: 32, textAlign: 'center' }}>
				<h2 style={{ fontWeight: 700, fontSize: 24, color: '#223', marginBottom: 18 }}>Paiement</h2>
				<p style={{ color: '#b91c1c', fontSize: 16, fontWeight: 500, marginBottom: 0 }}>
					Veuillez sélectionner un élève depuis une classe pour enregistrer un paiement.
				</p>
			</div>
		);
	}

	// Pour l’instant, on ne gère qu’un seul élève à la fois (premier de la liste)
	const eleve = eleves[0];

	return (
		<div style={{ maxWidth: 480, margin: '48px auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px #e5e7eb', padding: 32 }}>
			<h2 style={{ fontWeight: 700, fontSize: 24, color: '#223', marginBottom: 18 }}>Paiement</h2>
			<div style={{ marginBottom: 18 }}>
				<div style={{ marginBottom: 8, fontWeight: 500, color: '#444' }}>Nom de l’élève :</div>
				<div style={{ marginBottom: 12, color: '#2563eb', fontWeight: 600, fontSize: 17 }}>{eleve.nom} {eleve.postnom} {eleve.prenom}</div>
				<div style={{ marginBottom: 8, fontWeight: 500, color: '#444' }}>Classe :</div>
				<div style={{ marginBottom: 18, color: '#2563eb', fontWeight: 600, fontSize: 16 }}>{classe}</div>
			</div>
			<form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={e => e.preventDefault()}>
				<label style={{ fontWeight: 500, color: '#444', fontSize: 15 }}>
					Montant
					<input
						type="number"
						value={montant}
						onChange={e => setMontant(e.target.value)}
						placeholder="Montant en FCFA"
						style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 15, marginTop: 4 }}
						min="0"
						required
					/>
				</label>
				<label style={{ fontWeight: 500, color: '#444', fontSize: 15 }}>
					Motif
					<input
						type="text"
						value={motif}
						onChange={e => setMotif(e.target.value)}
						placeholder="Motif du paiement"
						style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: 15, marginTop: 4 }}
						required
					/>
				</label>
				<button
					type="submit"
					style={{ background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', borderRadius: 5, padding: '10px 0', marginTop: 8, cursor: 'pointer', boxShadow: '0 1px 4px #e5e7eb' }}
				>
					Valider le paiement
				</button>
			</form>
		</div>
	);
}
