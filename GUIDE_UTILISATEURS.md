# 👥 Guide du Système de Gestion des Utilisateurs

## ✅ Système implémenté avec succès !

Le système de gestion des utilisateurs est maintenant opérationnel avec **filtrage par rôle et permissions**.

---

## 🎯 Rôles et Permissions

### **👑 Administrateur**
- **Accès complet** à toutes les fonctionnalités
- Gestion des utilisateurs (ajout, modification, suppression)
- Toutes les classes accessibles
- Tous les rapports et exports PDF

### **🎓 Directeur**
- **Accès quasi-complet** sauf gestion des utilisateurs
- Toutes les classes accessibles
- Gestion des élèves et paiements
- Tous les rapports et exports PDF

### **💰 Comptable**
- **Focus financier**
- Toutes les classes accessibles (lecture seule pour élèves)
- Gestion des paiements uniquement
- Rapports financiers et exports PDF

### **👨‍🏫 Enseignant**
- **Accès limité à ses classes assignées**
- Consultation des élèves de sa classe
- Consultation des paiements (lecture seule)
- Export PDF de sa classe uniquement

---

## 🔐 Comptes de test disponibles

| Rôle | Identifiant | Mot de passe | Accès |
|------|-------------|--------------|-------|
| 👑 Admin | `admin` | `admin123` | Tout |
| 🎓 Directeur | `directeur` | `dir123` | Tout sauf gestion utilisateurs |
| 💰 Comptable | `comptable` | `compta123` | Paiements + rapports |
| 👨‍🏫 Enseignant | `enseignant1` | `ens123` | Primaire 2ème uniquement |

---

## 📋 Comment utiliser le système

### **1. Connexion**
1. Ouvrez http://localhost:5173
2. Entrez votre identifiant et mot de passe
3. Cliquez sur **"💡 Identifiants de test"** pour voir les comptes disponibles
4. Cliquez **"🔓 Se connecter"**

### **2. Navigation selon le rôle**

**Admin et Directeur** voient :
- 🏠 Accueil
- 💰 Saisie Paiement
- 👥 Utilisateurs (Admin uniquement)

**Comptable** voit :
- 🏠 Accueil
- 💰 Saisie Paiement

**Enseignant** voit :
- 🏠 Accueil (uniquement ses classes)
- Pas de menu "Saisie Paiement"

### **3. Gestion des utilisateurs (Admin uniquement)**

1. Connectez-vous en tant qu'**admin**
2. Cliquez sur **"👥 Utilisateurs"** dans le menu
3. Page de gestion avec liste des utilisateurs

**Ajouter un utilisateur :**
1. Cliquez **"➕ Ajouter un utilisateur"**
2. Remplissez le formulaire :
   - Nom d'utilisateur (unique)
   - Mot de passe
   - Nom complet
   - Email (optionnel)
   - Sélectionnez le rôle
3. **Pour un Enseignant**, assignez les classes :
   - Cliquez **"➕ Ajouter une classe"**
   - Sélectionnez Section et Classe
   - Ajoutez plusieurs classes si besoin
4. Cliquez **"➕ Créer"**

**Modifier un utilisateur :**
1. Cliquez sur **✏️** à côté de l'utilisateur
2. Modifiez les informations
3. Cliquez **"💾 Enregistrer"**

**Supprimer un utilisateur :**
1. Cliquez sur **🗑️** à côté de l'utilisateur
2. Confirmez la suppression
3. L'utilisateur est désactivé (pas supprimé définitivement)

---

## 🔒 Filtrage des accès

### **Exemple : Enseignant**

Si vous vous connectez avec `enseignant1` / `ens123` :

1. **Dashboard** : Vous ne voyez que les élèves de **Primaire 2ème**
2. **Cliquer sur une autre classe** → Message d'erreur : "❌ Vous n'avez pas accès à cette classe"
3. **Menu** : Pas de "Saisie Paiement" ni "Utilisateurs"
4. **Export PDF** : Uniquement pour votre classe

### **Exemple : Comptable**

Si vous vous connectez avec `comptable` / `compta123` :

1. **Dashboard** : Toutes les classes visibles
2. **Cliquer sur une classe** → Liste des élèves (lecture seule)
3. **Saisie Paiement** → Accessible pour toutes les classes
4. **Utilisateurs** → Pas d'accès

---

## 🎨 Interface de gestion des utilisateurs

### **Page "👥 Utilisateurs"**

**Tableau avec colonnes :**
- **ID** : Identifiant unique
- **Nom d'utilisateur** : Login
- **Nom complet** : Prénom + Nom
- **Email** : Adresse email
- **Rôle** : Badge coloré par rôle
- **Classes assignées** : Liste des classes (pour Enseignants)
- **Actions** : ✏️ Modifier, 🗑️ Supprimer

**Formulaire modal :**
- Design moderne avec fond sombre
- Validation des champs obligatoires
- Sélecteur de rôle avec badges colorés
- Section "Classes assignées" pour Enseignants
- Boutons Annuler / Créer ou Enregistrer

---

## 💾 Stockage des données

Les utilisateurs sont stockés dans `localStorage` sous la clé `lr_users` :

```javascript
[
  {
    id: 1,
    username: 'admin',
    password: 'admin123', // ⚠️ En clair pour démo, utiliser hash en production
    fullName: 'Administrateur Système',
    email: 'admin@larefference.cd',
    role: 'admin',
    active: true,
    assignedClasses: []
  },
  ...
]
```

---

## 🔧 Personnalisation

### **Ajouter un nouveau rôle :**

1. Ouvrir `src/utils/userManagement.js`
2. Ajouter dans `ROLES` :
   ```javascript
   SECRETAIRE: 'secretaire'
   ```
3. Définir les permissions dans `ROLE_PERMISSIONS`
4. Ajouter le label et la couleur

### **Ajouter une permission :**

1. Ajouter dans `PERMISSIONS` :
   ```javascript
   SEND_MESSAGES: 'send_messages'
   ```
2. Assigner aux rôles appropriés dans `ROLE_PERMISSIONS`
3. Utiliser `hasPermission(user, PERMISSIONS.SEND_MESSAGES)` dans le code

### **Changer les identifiants par défaut :**

Modifier `DEFAULT_USERS` dans `src/utils/userManagement.js`

---

## ⚠️ Sécurité (Important !)

**Pour la production, implémentez :**

1. **Hash des mots de passe** (bcrypt, argon2)
   - Ne jamais stocker en clair
   - Utiliser un algorithme de hash fort

2. **JWT / Sessions**
   - Token d'authentification
   - Expiration automatique
   - Refresh token

3. **Backend API**
   - Validation côté serveur
   - Protection CSRF
   - Rate limiting

4. **HTTPS obligatoire**
   - Certificat SSL
   - Pas de transmission en clair

---

## ✅ Tests à effectuer

1. **Connexion avec chaque rôle**
   - Vérifier que les menus sont corrects
   - Tester l'accès aux classes
   - Vérifier les restrictions

2. **Gestion des utilisateurs (Admin)**
   - Créer un nouvel utilisateur
   - Modifier un utilisateur existant
   - Désactiver un utilisateur
   - Assigner des classes à un enseignant

3. **Filtrage des classes (Enseignant)**
   - Se connecter en tant qu'enseignant
   - Essayer d'accéder à une classe non assignée
   - Vérifier que seule sa classe est accessible

4. **Permissions paiements (Comptable)**
   - Se connecter en tant que comptable
   - Accéder à Saisie Paiement
   - Vérifier que "Utilisateurs" n'apparaît pas

---

## 🎉 Résumé des fonctionnalités

✅ **4 rôles prédéfinis** (Admin, Directeur, Comptable, Enseignant)  
✅ **Système de permissions granulaires** (15+ permissions)  
✅ **Filtrage des classes par utilisateur** (Enseignants)  
✅ **Page de gestion des utilisateurs** (CRUD complet)  
✅ **Interface moderne avec modal** (Design dark mode)  
✅ **Validation des accès en temps réel**  
✅ **Stockage localStorage** (facile à migrer vers API)  
✅ **Comptes de test intégrés** (démo rapide)  

---

**Prochaines étapes suggérées :**
1. Implémenter le backend API (Node.js/Express ou PHP)
2. Ajouter le hash des mots de passe
3. Implémenter JWT pour l'authentification
4. Ajouter la récupération de mot de passe
5. Logs d'actions utilisateurs (audit trail)
