# LA DIFFERENCE — Application de gestion scolaire

Application React + Vite pour gérer élèves, classes, paiements et rôles utilisateurs (admin, directeur, comptable, enseignant). Données actuellement côté navigateur (localStorage) ; prêt à évoluer avec un backend/API.


## Prérequis
- Node 18+ (portable fournie dans `nodejs/` possible)
- npm

## Installation locale
```
npm install
npm run dev
```
Ouvre ensuite l’URL affichée (par défaut http://localhost:5173).

## Build production
```
npm run build
```
Le build statique est généré dans `dist/`.

## Déploiement Netlify (gratuit)
1. Créer un compte sur https://app.netlify.com/ (connexion GitHub recommandée).
2. “Add new site” → “Import an existing project”.
3. Sélectionner le repo GitHub `Alex27121987/la-refference`.
4. Build command : `npm run build`
5. Publish directory : `dist`
6. Lancer le déploiement. Netlify génère une URL `https://<nom>.netlify.app`.
7. Chaque `git push` sur `main` déclenchera un nouveau déploiement automatique.

## Notes actuelles
- Authentification et permissions gérées côté client (localStorage) pour la démo.
- Pour un usage réel multi-utilisateurs, prévoir un backend (API + base de données + stockage fichiers) puis connecter le frontend à l’API.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
