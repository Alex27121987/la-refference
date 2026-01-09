import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudents() {
    const students = await prisma.student.findMany({
        where: { classId: 1 }
    });
    
    console.log(`\n📊 TOTAL ÉLÈVES EN BASE (classId=1): ${students.length}\n`);
    
    if (students.length > 0) {
        console.log('Exemples:');
        students.slice(0, 10).forEach(s => {
            console.log(`  - ${s.nom} ${s.prenom} (${s.matricule})`);
        });
        if (students.length > 10) {
            console.log(`  ... et ${students.length - 10} autres`);
        }
    }
    
    await prisma.$disconnect();
}

checkStudents().catch(console.error);
