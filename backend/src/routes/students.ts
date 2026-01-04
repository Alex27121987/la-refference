import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /students - Lister tous les étudiants
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { classId, skip = 0, take = 50 } = req.query;

    const where: any = {};
    if (classId) {
      where.classId = parseInt(classId as string);
    }

    const students = await prisma.student.findMany({
      where,
      include: { class: true, payments: true },
      skip: parseInt(skip as string),
      take: parseInt(take as string)
    });

    const total = await prisma.student.count({ where });

    res.json({ students, total, page: skip, pageSize: take });
  } catch (error) {
    console.error('Erreur GET students:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /students/:id - Récupérer un étudiant par ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: { class: true, payments: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    res.json(student);
  } catch (error) {
    console.error('Erreur GET student:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /students - Créer un nouvel étudiant
router.post(
  '/',
  authenticate,
  requirePermission('manage_students'),
  async (req: AuthRequest, res) => {
    try {
      const { matricule, nom, prenom, naissance, tel, classId } = req.body;

      if (!matricule || !nom || !classId) {
        return res.status(400).json({ error: 'matricule, nom et classId requis' });
      }

      const newStudent = await prisma.student.create({
        data: {
          matricule,
          nom,
          prenom: prenom || null,
          naissance: naissance || null,
          tel: tel || null,
          classId
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'CREATE',
          entity: 'Student',
          entityId: newStudent.id
        }
      });

      res.status(201).json(newStudent);
    } catch (error) {
      console.error('Erreur POST student:', error);
      if ((error as any).code === 'P2002') {
        return res.status(400).json({ error: 'Matricule déjà existant' });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// PUT /students/:id - Modifier un étudiant
router.put(
  '/:id',
  authenticate,
  requirePermission('manage_students'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { matricule, nom, prenom, naissance, tel, classId } = req.body;

      const updated = await prisma.student.update({
        where: { id: parseInt(id) },
        data: {
          matricule: matricule || undefined,
          nom: nom || undefined,
          prenom: prenom || undefined,
          naissance: naissance || undefined,
          tel: tel || undefined,
          classId: classId || undefined
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'UPDATE',
          entity: 'Student',
          entityId: parseInt(id)
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Erreur PUT student:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /students/:id - Supprimer un étudiant
router.delete(
  '/:id',
  authenticate,
  requirePermission('delete_records'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      await prisma.student.delete({
        where: { id: parseInt(id) }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'DELETE',
          entity: 'Student',
          entityId: parseInt(id)
        }
      });

      res.json({ message: 'Étudiant supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE student:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;
