# Render Build/Start Commands

Pour Render, configurez ainsi :

**Build Command**
```
cd backend && npm install && npx prisma generate && npm run build
```

**Start Command**
```
cd backend && npx prisma migrate deploy && npm run start
```

Cela garantit que toutes les dépendances sont installées dans le bon dossier.
