import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    roleId: number;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, env.jwtSecret) as {
      userId: number;
      username: string;
      roleId: number;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware pour vérifier les permissions
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      // Récupérer le rôle et ses permissions depuis Prisma
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { role: true }
      });

      await prisma.$disconnect();

      if (!user || !user.role.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Permission refusée' });
      }

      next();
    } catch (error) {
      console.error('Erreur permission check:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};
