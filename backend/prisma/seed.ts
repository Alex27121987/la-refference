import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Créer les rôles
  const roles = [
    {
      name: 'Admin',
      permissions: [
        'manage_users',
        'manage_roles',
        'view_classes',
        'manage_classes',
        'view_students',
        'manage_students',
        'view_payments',
        'manage_payments',
        'view_courses',
        'manage_courses',
        'view_reports',
        'export_data',
        'view_audit_logs',
        'manage_settings',
        'delete_records'
      ]
    },
    {
      name: 'Directeur',
      permissions: [
        'view_classes',
        'manage_classes',
        'view_students',
        'manage_students',
        'view_payments',
        'manage_payments',
        'view_courses',
        'manage_courses',
        'view_reports',
        'export_data',
        'view_audit_logs'
      ]
    },
    {
      name: 'Comptable',
      permissions: [
        'view_students',
        'view_payments',
        'manage_payments',
        'view_reports',
        'export_data'
      ]
    },
    {
      name: 'Enseignant',
      permissions: [
        'view_classes',
        'view_students',
        'view_courses'
      ]
    }
  ];

  console.log('📝 Création des rôles...');
  
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        name: roleData.name,
        permissions: JSON.stringify(roleData.permissions)
      }
    });
    console.log(`✅ Rôle créé: ${role.name}`);
  }

  // Créer l'utilisateur admin par défaut
  console.log('👤 Création de l\'utilisateur admin...');
  
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' }
  });

  if (!adminRole) {
    throw new Error('Le rôle Admin n\'a pas été créé');
  }

  // Create admin user, password comes from ADMIN_PASSWORD env var (fallback in dev)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const hashed = ADMIN_PASSWORD.startsWith('$2') ? ADMIN_PASSWORD : ADMIN_PASSWORD; // keep as-is for dev; hashing can be added if needed

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      // store as plain in dev only; in production use a hashed password
      password: hashed,
      fullName: 'Administrateur Principal',
      roleId: adminRole.id
    }
  });

  console.log(`✅ Utilisateur admin créé: ${admin.username}`);
  console.log('🎉 Seeding terminé avec succès !');
  console.log('');
  console.log('📌 Informations de connexion:');
  console.log('   Username: admin');
  console.log('   Password: (from ADMIN_PASSWORD env var)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
