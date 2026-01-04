import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /users - Lister tous les utilisateurs (Admin seulement)
router.get('/', authenticate, requirePermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const { skip = 0, take = 50 } = req.query;

    const users = await prisma.user.findMany({
      include: { role: true },
      skip: parseInt(skip as string),
      take: parseInt(take as string)
    });

    const total = await prisma.user.count();

    // Retourner les utilisateurs sans les mots de passe
    const safeUsers = users.map(({ password, ...rest }) => rest);

    res.json({ users: safeUsers, total, page: skip, pageSize: take });
  } catch (error) {
    console.error('Erreur GET users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /users/:id - Récupérer un utilisateur par ID
router.get('/:id', authenticate, requirePermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Erreur GET user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /users - Créer un nouvel utilisateur (Admin seulement)
router.post('/', authenticate, requirePermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const { username, password, fullName, roleId } = req.body;

    if (!username || !password || !fullName || !roleId) {
      return res.status(400).json({ error: 'username, password, fullName et roleId requis' });
    }

    // Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(400).json({ error: 'Rôle non trouvé' });
    }

    // Hasher le password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        roleId
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE',
        entity: 'User',
        entityId: newUser.id
      }
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      roleId: newUser.roleId,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    });
  } catch (error) {
    console.error('Erreur POST user:', error);
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Username déjà existant' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /users/:id - Modifier un utilisateur (Admin seulement)
router.put('/:id', authenticate, requirePermission('manage_users'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { fullName, roleId, password } = req.body;

    const data: any = {};
    if (fullName) data.fullName = fullName;
    if (roleId) data.roleId = roleId;
    if (password) data.password = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: parseInt(id)
      }
    });

    res.json({
      id: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      roleId: updated.roleId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error('Erreur PUT user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /users/:id - Supprimer un utilisateur (Admin seulement)
router.delete('/:id', authenticate, requirePermission('delete_records'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre à un admin de se supprimer lui-même
    if (parseInt(id) === req.user!.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'DELETE',
        entity: 'User',
        entityId: parseInt(id)
      }
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
