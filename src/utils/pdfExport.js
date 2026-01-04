/**
 * Utilitaires d'export PDF
 * Utilise l'API print du navigateur pour générer des PDFs professionnels
 */

export const generatePDF = (title, content, filename) => {
  const printWindow = window.open('', '', 'width=1000,height=800');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.3;
          color: #333;
          padding: 20px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        
        .header h1 {
          font-size: 24px;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 12px;
          color: #7f8c8d;
        }
        
        .content {
          margin-top: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 12px;
        }
        
        table thead {
          background-color: #34495e;
          color: white;
          font-weight: bold;
        }
        
        table th {
          padding: 8px;
          text-align: left;
          border: 1px solid #bdc3c7;
        }
        
        table td {
          padding: 6px 8px;
          border: 1px solid #ecf0f1;
        }
        
        table tbody tr:nth-child(odd) {
          background-color: #f8f9fa;
        }
        
        table tbody tr:nth-child(even) {
          background-color: #ffffff;
        }
        
        table tbody tr:hover {
          background-color: #ecf0f1;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        
        .stat-card {
          border: 1px solid #bdc3c7;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
          background: #f8f9fa;
        }
        
        .stat-card .label {
          font-size: 11px;
          color: #7f8c8d;
          margin-bottom: 5px;
        }
        
        .stat-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #2c3e50;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          margin: 20px 0 10px 0;
          border-left: 4px solid #3498db;
          padding-left: 10px;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #bdc3c7;
          text-align: center;
          font-size: 10px;
          color: #95a5a6;
        }
        
        .date {
          font-size: 11px;
          color: #7f8c8d;
          margin-bottom: 10px;
        }
        
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .badge-success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .badge-danger {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .badge-warning {
          background-color: #fff3cd;
          color: #856404;
        }
        
        @media print {
          body {
            padding: 0;
          }
          table {
            page-break-inside: avoid;
          }
          .section-title {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${title}</h1>
        <p>LA DIFFERENCE - Système de Gestion Scolaire</p>
        <p class="date">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
      
      <div class="content">
        ${content}
      </div>
      
      <div class="footer">
        <p>&copy; 2026 LA DIFFERENCE - Document confidentiel</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Attendre que le contenu soit chargé avant de déclencher l'impression
  printWindow.onload = () => {
    printWindow.print();
  };
};

// Export des étudiants d'une classe en PDF
export const exportClassStudentsPDF = (className, sectionName, students) => {
  const table = `
    <div class="section-title">📚 Liste des élèves - ${sectionName} ${className}</div>
    <p>Total: <strong>${students.length}</strong> élève(s)</p>
    
    <table>
      <thead>
        <tr>
          <th>N°</th>
          <th>Matricule</th>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Date Naissance</th>
          <th>Téléphone</th>
        </tr>
      </thead>
      <tbody>
        ${students.map((s, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${s.matricule || '-'}</td>
            <td>${s.nom || '-'}</td>
            <td>${s.prenom || '-'}</td>
            <td>${s.naissance || '-'}</td>
            <td>${s.tel || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  generatePDF(`Classe: ${sectionName} - ${className}`, table, `${sectionName}_${className}_eleves.pdf`);
};

// Export de la situation financière en PDF
export const exportFinancialSituationPDF = (className, sectionName, students, payments) => {
  const calculateDebt = (student) => {
    const studentPayments = payments[student.id] || {};
    const monthlyFee = 16500; // À adapter selon la classe
    const totalDue = monthlyFee * 3; // 3 mois
    const totalPaid = Object.values(studentPayments).reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.max(0, totalDue - totalPaid);
  };
  
  const totalDebt = students.reduce((sum, s) => sum + calculateDebt(s), 0);
  const totalPaid = students.reduce((sum, s) => sum + (Object.values(payments[s.id] || {}).reduce((psum, p) => psum + (p.amount || 0), 0)), 0);
  
  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Dû</div>
        <div class="value">${(totalDebt / 1000).toFixed(0)}K CDF</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Payé</div>
        <div class="value">${(totalPaid / 1000).toFixed(0)}K CDF</div>
      </div>
      <div class="stat-card">
        <div class="label">Élèves</div>
        <div class="value">${students.length}</div>
      </div>
    </div>
  `;
  
  const table = `
    <div class="section-title">💰 Situation Financière - ${sectionName} ${className}</div>
    ${statsHtml}
    
    <table>
      <thead>
        <tr>
          <th>Élève</th>
          <th>Dû</th>
          <th>Payé</th>
          <th>Reste</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(s => {
          const debt = calculateDebt(s);
          const paid = Object.values(payments[s.id] || {}).reduce((sum, p) => sum + (p.amount || 0), 0);
          const status = debt === 0 ? '✓ À jour' : '⚠ Retard';
          return `
            <tr>
              <td>${s.nom} ${s.prenom}</td>
              <td>${debt.toLocaleString('fr-FR')} CDF</td>
              <td>${paid.toLocaleString('fr-FR')} CDF</td>
              <td>${(debt - paid).toLocaleString('fr-FR')} CDF</td>
              <td><span class="badge ${debt === 0 ? 'badge-success' : 'badge-danger'}">${status}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  generatePDF(`Situation Financière: ${sectionName} - ${className}`, table, `situation_${sectionName}_${className}.pdf`);
};

// Export du dashboard (résumé général)
export const exportDashboardPDF = (sections) => {
  const totalStudents = sections.reduce((sum, s) => sum + s.students, 0);
  const totalTeachers = sections.reduce((sum, s) => sum + s.teachers, 0);
  
  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Élèves Total</div>
        <div class="value">${totalStudents}</div>
      </div>
      <div class="stat-card">
        <div class="label">Enseignants</div>
        <div class="value">${totalTeachers}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sections</div>
        <div class="value">${sections.length}</div>
      </div>
    </div>
  `;
  
  const table = `
    <div class="section-title">📋 Résumé par Section</div>
    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Élèves</th>
          <th>Enseignants</th>
        </tr>
      </thead>
      <tbody>
        ${sections.map(s => `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.students}</td>
            <td>${s.teachers}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  generatePDF('Rapport Général', statsHtml + table, 'rapport_general.pdf');
};
