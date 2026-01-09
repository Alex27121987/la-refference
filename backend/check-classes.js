import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClasses() {
    console.log('\n📚 CLASSES EN BASE DE DONNÉES:\n');
    
    const classes = await prisma.class.findMany();
    
    if (classes.length === 0) {
        console.log('❌ Aucune classe en base !');
    } else {
        classes.forEach(c => {
            console.log(`  ID: ${c.id} | Nom: ${c.name} | Section: ${c.section} | Année: ${c.year || 'N/A'}`);
        });
    }
    
    console.log('\n📊 ÉLÈVES PAR CLASSE:\n');
    
    for (const cls of classes) {
        const count = await prisma.student.count({
            where: { classId: cls.id }
        });
        console.log(`  ${cls.name} (ID ${cls.id}): ${count} élèves`);
    }
    
    await prisma.$disconnect();
}

checkClasses().catch(console.error);
