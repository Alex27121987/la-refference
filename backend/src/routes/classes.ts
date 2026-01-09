import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /classes - Lister toutes les classes
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: { students: true, courses: true }
    });

    res.json(classes);
  } catch (error) {
    console.error('Erreur GET classes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /classes/:id - Récupérer une classe par ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: { students: true, courses: true }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    res.json(classData);
  } catch (error) {
    console.error('Erreur GET class:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /classes - Créer une nouvelle classe
router.post(
  '/',
  authenticate,
  requirePermission('manage_classes'),
  async (req: AuthRequest, res) => {
    try {
      const { name, section, year } = req.body;

      if (!name || !section) {
        return res.status(400).json({ error: 'Name et section requis' });
      }

      const newClass = await prisma.class.create({
        data: {
          name,
          section,
          year: year || null
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'CREATE',
          entity: 'Class',
          entityId: newClass.id
        }
      });

      res.status(201).json(newClass);
    } catch (error) {
      console.error('Erreur POST class:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// PUT /classes/:id - Modifier une classe
router.put(
  '/:id',
  authenticate,
  requirePermission('manage_classes'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, section, year } = req.body;

      const updated = await prisma.class.update({
        where: { id: parseInt(id) },
        data: {
          name: name || undefined,
          section: section || undefined,
          year: year || undefined
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'UPDATE',
          entity: 'Class',
          entityId: parseInt(id)
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Erreur PUT class:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /classes/:id - Supprimer une classe
router.delete(
  '/:id',
  authenticate,
  requirePermission('delete_records'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      await prisma.class.delete({
        where: { id: parseInt(id) }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'DELETE',
          entity: 'Class',
          entityId: parseInt(id)
        }
      });

      res.json({ message: 'Classe supprimée avec succès' });
    } catch (error) {
      console.error('Erreur DELETE class:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;
