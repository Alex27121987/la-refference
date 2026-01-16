import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /payments - Lister tous les paiements
router.get('/', authenticate, async (req: AuthRequest<any, any, any, any>, res: import('express').Response) => {
  try {
    const { studentId, skip = 0, take = 50, startDate, endDate } = req.query;

    const where: any = {};
    if (studentId) {
      where.studentId = parseInt(studentId as string);
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { student: { include: { class: true } } },
      orderBy: { date: 'desc' },
      skip: parseInt(skip as string),
      take: parseInt(take as string)
    });

    const total = await prisma.payment.count({ where });

    res.json({ payments, total, page: skip, pageSize: take });
  } catch (error) {
    console.error('Erreur GET payments:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /payments/:id - Récupérer un paiement par ID
router.get('/:id', authenticate, async (req: AuthRequest<any, any, any, any>, res: import('express').Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { student: { include: { class: true } } }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Erreur GET payment:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /payments/student/:studentId - Lister les paiements d'un étudiant
router.get('/student/:studentId', authenticate, async (req: AuthRequest<any, any, any, any>, res: import('express').Response) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { studentId: parseInt(studentId) },
      include: { student: { include: { class: true } } },
      orderBy: { date: 'desc' }
    });

    const totalAmount = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

    res.json({ payments, totalAmount });
  } catch (error) {
    console.error('Erreur GET payments/student:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /payments - Créer un nouveau paiement
router.post(
  '/',
  authenticate,
  requirePermission('manage_payments'),
  async (req: AuthRequest<any, any, any, any>, res: import('express').Response) => {
    try {
      const { studentId, amount, method, note, date } = req.body;

      if (!studentId || !amount) {
        return res.status(400).json({ error: 'studentId et amount requis' });
      }

      const newPayment = await prisma.payment.create({
        data: {
          studentId,
          amount,
          method: method || null,
          note: note || null,
          date: date ? new Date(date) : new Date()
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'CREATE',
          entity: 'Payment',
          entityId: newPayment.id
        }
      });

      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Erreur POST payment:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// PUT /payments/:id - Modifier un paiement
router.put(
  '/:id',
  authenticate,
  requirePermission('manage_payments'),
  async (req: AuthRequest<any, any, any, any>, res: import('express').Response) => {
    try {
      const { id } = req.params;
      const { amount, method, note, date } = req.body;

      const updated = await prisma.payment.update({
        where: { id: parseInt(id) },
        data: {
          amount: amount || undefined,
          method: method || undefined,
          note: note || undefined,
          date: date ? new Date(date) : undefined
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'UPDATE',
          entity: 'Payment',
          entityId: parseInt(id)
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Erreur PUT payment:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// DELETE /payments/:id - Supprimer un paiement
router.delete(
  '/:id',
  authenticate,
  requirePermission('delete_records'),
  async (req: AuthRequest<any, any, any, any>, res: import('express').Response) => {
    try {
      const { id } = req.params;

      await prisma.payment.delete({
        where: { id: parseInt(id) }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'DELETE',
          entity: 'Payment',
          entityId: parseInt(id)
        }
      });

      res.json({ message: 'Paiement supprimé avec succès' });
    } catch (error) {
      console.error('Erreur DELETE payment:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;
