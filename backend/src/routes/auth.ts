import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const router = Router();
const prisma = new PrismaClient();

// Types
interface LoginRequest {
  username: string;
  password: string;
}

interface JwtPayload {
  userId: number;
  username: string;
  roleId: number;
}

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username et password requis' });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Vérifier le mot de passe
    let isPasswordValid = false;
    try {
      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        // bcrypt hash
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Plain-text stored (dev seed) — compare directly
        isPasswordValid = password === user.password;
      }
    } catch (e) {
      console.error('Erreur vérification mot de passe:', e);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Générer JWT (access token)
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, roleId: user.roleId } as JwtPayload,
      env.jwtSecret,
      { expiresIn: '15m' }
    );

    // Générer refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      env.refreshSecret,
      { expiresIn: '7d' }
    );

    // Sauvegarder le refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    // Envoyer refresh token en httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id
      }
    });

    // Retourner les infos utilisateur + access token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      },
      accessToken
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant' });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, env.refreshSecret) as { userId: number };

    // Vérifier qu'il existe en BD
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Générer nouveau access token
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, roleId: user.roleId } as JwtPayload,
      env.jwtSecret,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Erreur refresh:', error);
    res.status(401).json({ error: 'Refresh token invalide' });
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Supprimer le refresh token de la BD
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Supprimer le cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
