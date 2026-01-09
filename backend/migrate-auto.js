// Migration automatique 1ère Primaire
// Ce script lit un fichier JSON et insère dans la base de données

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

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
    console.log('  MIGRATION 1ÈRE PRIMAIRE → LA DIFFERENCE');
    console.log('========================================\n');

    // Lire le fichier de données
    const dataFile = path.join(__dirname, '..', '..', '1ere-primaire-data.json');
    
    if (!fs.existsSync(dataFile)) {
        console.error(`❌ Fichier introuvable: ${dataFile}`);
        console.log('\nVeuillez générer le fichier d\'abord avec extraction-1ere-primaire.html');
        process.exit(1);
    }

    const students = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`📊 ${students.length} élèves trouvés\n`);

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        try {
            const enrollmentDate = extractDateFromMatricule(s.matricule);
            let matricule = s.matricule || '';
            let attempt = 0;
            
            // Si le matricule existe déjà, ajouter un suffixe
            while (attempt < 30) {
                try {
                    const testMatricule = attempt === 0 ? matricule : `${matricule}-dup${attempt}`;
                    
                    await prisma.student.create({
                        data: {
                            matricule: testMatricule,
                            nom: s.nom || '',
                            prenom: (s.prenom || '') + (s.postnom ? ' ' + s.postnom : ''),
                            naissance: s.dateNaissance || null,
                            tel: s.telephone || s.adresse || '',
                            classId: 1
                        }
                    });

                    const date = enrollmentDate ? enrollmentDate.toISOString().split('T')[0] : 'N/A';
                    const dupMsg = attempt > 0 ? ` [DUPLIQUÉ ${attempt}]` : '';
                    console.log(`✓ ${s.nom} ${s.prenom} (${testMatricule}) - Inscrit: ${date}${dupMsg}`);
                    successCount++;
                    if (attempt > 0) duplicateCount++;
                    break; // Succès, on sort de la boucle
                } catch (innerError) {
                    if (innerError.message.includes('Unique constraint') && attempt < 29) {
                        attempt++;
                        continue; // Essayer avec le prochain suffixe
                    }
                    throw innerError; // Autre erreur, on remonte
                }
            }
        } catch (error) {
            console.error(`✗ ${s.nom} ${s.prenom}: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n========================================');
    console.log(`  MIGRATION TERMINÉE`);
    console.log(`  ✓ Succès: ${successCount}`);
    console.log(`  ⚠ Dupliqués (renommés): ${duplicateCount}`);
    console.log(`  ✗ Erreurs: ${errorCount}`);
    console.log('========================================\n');

    await prisma.$disconnect();
}

migrate().catch(e => {
    console.error('Erreur fatale:', e);
    process.exit(1);
});
