import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPrimaireClasses() {
    console.log('\n🏗️  CRÉATION DES CLASSES PRIMAIRES...\n');
    
    // Créer la classe 1ère Primaire
    const classe1ere = await prisma.class.create({
        data: {
            name: '1ère Primaire',
            section: 'Primaire',
            year: '2025-2026'
        }
    });
    
    console.log(`✓ Classe créée: ${classe1ere.name} (ID: ${classe1ere.id})`);
    
    // Déplacer les 388 élèves de TEST-CLASS vers 1ère Primaire
    const updated = await prisma.student.updateMany({
        where: { classId: 1 },
        data: { classId: classe1ere.id }
    });
    
    console.log(`✓ ${updated.count} élèves déplacés vers 1ère Primaire\n`);
    
    // Créer les autres classes primaires
    const autresClasses = [
        { name: '2ème Primaire', section: 'Primaire' },
        { name: '3ème Primaire', section: 'Primaire' },
        { name: '4ème Primaire', section: 'Primaire' },
        { name: '5ème Primaire', section: 'Primaire' },
        { name: '6ème Primaire', section: 'Primaire' }
    ];
    
    for (const cls of autresClasses) {
        const created = await prisma.class.create({
            data: { ...cls, year: '2025-2026' }
        });
        console.log(`✓ Classe créée: ${created.name} (ID: ${created.id})`);
    }
    
    console.log('\n✅ TERMINÉ !\n');
    
    await prisma.$disconnect();
}

createPrimaireClasses().catch(console.error);
