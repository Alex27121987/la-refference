import jsPDF from "jspdf";

/* =====================================================
   BOUTON PDF GLOBAL
===================================================== */
export function handleGeneratePdf(context) {
  if (!context || !context.type || !context.data) {
    alert("Aucune donnée disponible pour le PDF.");
    return;
  }

  switch (context.type) {
    case "recu-paiement":
      genererRecuPaiement(context.data);
      break;
    case "situation-financiere":
      genererSituationFinanciere(context.data);
      break;
    case "rapport-general":
      genererRapportGeneral(context.data);
      break;
    case "liste-classe":
      genererListeClasse(context.data);
      break;
    default:
      alert("Type de document PDF non reconnu.");
  }
/* =====================================================
   LISTE DE CLASSE
===================================================== */
function genererListeClasse(data) {
  const { classe, eleves = [] } = data;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("LISTE DES ÉLÈVES", 20, 20);
  doc.setFontSize(12);
  doc.text(`Classe : ${classe}`, 20, 32);
  let y = 45;
  eleves.forEach((e, i) => {
    doc.text(
      `${i + 1}. ${e.matricule} – ${e.nom} ${e.postnom} ${e.prenom}`,
      20,
      y
    );
    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  });
  doc.save(`liste_eleves_${classe}.pdf`);
}
}

/* =====================================================
   REÇU DE PAIEMENT
===================================================== */
function genererRecuPaiement(data) {
  const paiement = data?.paiement;
  if (!paiement) {
    alert("Aucun paiement sélectionné.");
    return;
  }

  const eleve = paiement.eleve || {};
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("REÇU DE PAIEMENT", 20, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("École : C.S La Référence", 20, 35);
  doc.text(`Nom : ${eleve.nom || ""} ${eleve.postnom || ""} ${eleve.prenom || ""}`, 20, 45);
  doc.text(`Matricule : ${eleve.matricule || ""}`, 20, 55);
  doc.text(`Classe : ${paiement.classe || ""}`, 20, 65);
  doc.text(`Type : ${paiement.type || ""}`, 20, 75);
  doc.text(`Montant : ${paiement.montant || 0} FC`, 20, 85);
  doc.text(`Date : ${paiement.date || ""}`, 20, 95);

  doc.text("Signature :", 20, 120);
  doc.line(45, 120, 120, 120);

  doc.save(`recu_${eleve.matricule || "eleve"}.pdf`);
}

/* =====================================================
   SITUATION FINANCIÈRE
===================================================== */
function genererSituationFinanciere(data) {
  const { className, sectionName, students = [] } = data;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("SITUATION FINANCIÈRE", 20, 20);

  doc.setFontSize(12);
  doc.text(`Section : ${sectionName}`, 20, 35);
  doc.text(`Classe : ${className}`, 20, 45);
  doc.text(`Nombre d'élèves : ${students.length}`, 20, 55);

  let y = 70;
  students.forEach((s, i) => {
    doc.text(`${i + 1}. ${s.fullName || ""}`, 20, y);
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(`situation_${className}.pdf`);
}

/* =====================================================
   RAPPORT GÉNÉRAL
===================================================== */
function genererRapportGeneral(data) {
  const sections = data.sections || [];
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("RAPPORT GÉNÉRAL", 20, 20);

  let y = 40;
  sections.forEach((s, i) => {
    doc.text(`${i + 1}. ${s.name}`, 20, y);
    y += 10;
  });

  doc.save("rapport_general.pdf");
}
