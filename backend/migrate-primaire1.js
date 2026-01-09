// Script de migration directe - 1ère Primaire
// Extrait de localStorage et insère dans la base de données

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Données extraites (à remplacer par vos données)
const STUDENTS_DATA = `__DATA_PLACEHOLDER__`;

function extractDateFromMatricule(matricule) {
    if (!matricule) return null;
    const match = matricule.match(/^(\d{2})\/(\d{2})-\d{3}$/);
    if (!match) return null;
    
    const day = match[1];
    const month = match[2];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    let year = currentYear;
    if (parseInt(month) > currentMonth) {
        year = currentYear - 1;
    }
    
    return new Date(`${year}-${month}-${day}`);
}

async function migrate() {
    console.log('\n========================================');
    console.log('  MIGRATION 1ÈRE PRIMAIRE');
    console.log('========================================\n');

    let students;
    try {
        students = JSON.parse(STUDENTS_DATA);
    } catch (e) {
        console.error('Erreur: Données invalides');
        process.exit(1);
    }

    console.log(`Nombre d'élèves à migrer: ${students.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const s of students) {
        try {
            const enrollmentDate = extractDateFromMatricule(s.matricule);
            
            const student = await prisma.student.create({
                data: {
                    firstName: s.prenom || '',
                    lastName: s.nom || '',
                    middleName: s.postnom || '',
                    dateOfBirth: s.dateNaissance ? new Date(s.dateNaissance) : null,
                    gender: s.sexe === 'F' ? 'F' : 'M',
                    enrollmentNumber: s.matricule || '',
                    enrollmentDate: enrollmentDate,
                    address: s.adresse || '',
                    phone: s.telephone || '',
                    classId: 1, // 1ère Primaire
                    status: 'active'
                }
            });

            console.log(`✓ ${s.nom} ${s.prenom} (${s.matricule})`);
            successCount++;
        } catch (error) {
            console.error(`✗ ${s.nom} ${s.prenom}: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n========================================');
    console.log(`  TERMINÉ`);
    console.log(`  Succès: ${successCount}`);
    console.log(`  Erreurs: ${errorCount}`);
    console.log('========================================\n');

    await prisma.$disconnect();
}

migrate();
