/**
 * Système de gestion des utilisateurs et permissions
 */

// Définition des rôles et leurs permissions
export const ROLES = {
  ADMIN: 'admin',
  DIRECTEUR: 'directeur',
  COMPTABLE: 'comptable',
  ENSEIGNANT: 'enseignant'
};

// Définition des permissions
export const PERMISSIONS = {
  // Gestion des utilisateurs
  MANAGE_USERS: 'manage_users',
  
  // Gestion des élèves
  VIEW_STUDENTS: 'view_students',
  ADD_STUDENTS: 'add_students',
  EDIT_STUDENTS: 'edit_students',
  DELETE_STUDENTS: 'delete_students',
  IMPORT_STUDENTS: 'import_students',
  
  // Gestion des paiements
  VIEW_PAYMENTS: 'view_payments',
  ADD_PAYMENTS: 'add_payments',
  EDIT_PAYMENTS: 'edit_payments',
  DELETE_PAYMENTS: 'delete_payments',
  
  // Rapports et exports
  VIEW_REPORTS: 'view_reports',
  EXPORT_PDF: 'export_pdf',
  VIEW_STATISTICS: 'view_statistics',
  
  // Gestion des classes
  VIEW_ALL_CLASSES: 'view_all_classes',
  VIEW_OWN_CLASS: 'view_own_class',
  
  // Autres
  SYNC_DATA: 'sync_data',
  VIEW_FINANCIAL_SITUATION: 'view_financial_situation'
};

// Permissions par rôle
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin a TOUTES les permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.DIRECTEUR]: [
    // Directeur : consultation et rapports uniquement, pas de modifications
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_PDF,
    PERMISSIONS.VIEW_STATISTICS,
    PERMISSIONS.VIEW_ALL_CLASSES,
    PERMISSIONS.VIEW_FINANCIAL_SITUATION
  ],
  
  [ROLES.COMPTABLE]: [
    // Comptable : paiements uniquement (ajout/modification), rapports financiers
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.ADD_PAYMENTS,
    PERMISSIONS.EDIT_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_PDF,
    PERMISSIONS.VIEW_ALL_CLASSES,
    PERMISSIONS.VIEW_FINANCIAL_SITUATION
  ],
  
  [ROLES.ENSEIGNANT]: [
    // Enseignant : uniquement sa classe, lecture seule
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_OWN_CLASS,
    PERMISSIONS.VIEW_PAYMENTS
  ]
};

// Utilisateurs par défaut (stockés en localStorage)
export const DEFAULT_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123', // En production, utiliser un hash !
    role: ROLES.ADMIN,
    fullName: 'Administrateur Système',
    email: 'admin@larefference.cd',
    active: true,
    assignedClasses: [] // Admin voit tout
  },
  {
    id: 2,
    username: 'directeur',
    password: 'dir123',
    role: ROLES.DIRECTEUR,
    fullName: 'Directeur Général',
    email: 'directeur@larefference.cd',
    active: true,
    assignedClasses: [] // Directeur voit tout
  },
  {
    id: 3,
    username: 'comptable',
    password: 'compta123',
    role: ROLES.COMPTABLE,
    fullName: 'Comptable Principal',
    email: 'comptable@larefference.cd',
    active: true,
    assignedClasses: [] // Comptable voit tout
  },
  {
    id: 4,
    username: 'enseignant1',
    password: 'ens123',
    role: ROLES.ENSEIGNANT,
    fullName: 'Enseignant Primaire',
    email: 'enseignant1@larefference.cd',
    active: true,
    assignedClasses: [
      { sectionName: 'Primaire', className: '2ème' }
    ]
  }
];

// Initialiser les utilisateurs dans localStorage si pas encore fait
export const initializeUsers = () => {
  const existing = localStorage.getItem('lr_users');
  if (!existing) {
    localStorage.setItem('lr_users', JSON.stringify(DEFAULT_USERS));
  }
};

// Récupérer tous les utilisateurs
export const getUsers = () => {
  const users = localStorage.getItem('lr_users');
  return users ? JSON.parse(users) : DEFAULT_USERS;
};

// Récupérer un utilisateur par ID
export const getUserById = (id) => {
  const users = getUsers();
  return users.find(u => u.id === id);
};

// Authentifier un utilisateur
export const authenticateUser = (username, password) => {
  const users = getUsers();
  const user = users.find(u => 
    u.username === username && 
    u.password === password && 
    u.active
  );
  
  if (user) {
    // Ne pas retourner le mot de passe
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
};

// Vérifier si un utilisateur a une permission
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

// Vérifier si un utilisateur peut accéder à une classe
export const canAccessClass = (user, sectionName, className) => {
  if (!user) return false;
  
  // Admin et Directeur ont accès à tout
  if (user.role === ROLES.ADMIN || user.role === ROLES.DIRECTEUR) {
    return true;
  }
  
  // Comptable a accès à toutes les classes (pour les paiements)
  if (user.role === ROLES.COMPTABLE) {
    return true;
  }
  
  // Enseignant : vérifier les classes assignées
  if (user.role === ROLES.ENSEIGNANT) {
    if (!user.assignedClasses || user.assignedClasses.length === 0) {
      return false;
    }
    
    return user.assignedClasses.some(c => 
      c.sectionName === sectionName && c.className === className
    );
  }
  
  return false;
};

// Récupérer les classes accessibles pour un utilisateur
export const getAccessibleClasses = (user) => {
  if (!user) return [];
  
  // Admin et Directeur ont accès à toutes les classes
  if (user.role === ROLES.ADMIN || user.role === ROLES.DIRECTEUR || user.role === ROLES.COMPTABLE) {
    // Retourner toutes les classes disponibles
    return [
      { sectionName: 'Maternelle', classes: ['1ère Mat', '2ème Mat', '3ème Mat'] },
      { sectionName: 'Primaire', classes: ['1ère', '2ème', '3ème', '4ème', '5ème', '6ème'] },
      { sectionName: 'Secondaire', classes: ['7EB', '8EB', '1', '2', '3', '4'] }
    ];
  }
  
  // Enseignant : uniquement ses classes assignées
  if (user.role === ROLES.ENSEIGNANT) {
    return user.assignedClasses || [];
  }
  
  return [];
};

// Ajouter un utilisateur
export const addUser = (newUser) => {
  const users = getUsers();
  const maxId = Math.max(...users.map(u => u.id), 0);
  const user = {
    ...newUser,
    id: maxId + 1,
    active: true
  };
  users.push(user);
  localStorage.setItem('lr_users', JSON.stringify(users));
  return user;
};

// Modifier un utilisateur
export const updateUser = (userId, updates) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem('lr_users', JSON.stringify(users));
    return users[index];
  }
  return null;
};

// Supprimer un utilisateur (désactivation)
export const deleteUser = (userId) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].active = false;
    localStorage.setItem('lr_users', JSON.stringify(users));
    return true;
  }
  return false;
};

// Labels des rôles pour l'affichage
export const getRoleLabel = (role) => {
  const labels = {
    [ROLES.ADMIN]: '👑 Administrateur',
    [ROLES.DIRECTEUR]: '🎓 Directeur',
    [ROLES.COMPTABLE]: '💰 Comptable',
    [ROLES.ENSEIGNANT]: '👨‍🏫 Enseignant'
  };
  return labels[role] || role;
};

// Couleurs des rôles
export const getRoleColor = (role) => {
  const colors = {
    [ROLES.ADMIN]: '#e74c3c',
    [ROLES.DIRECTEUR]: '#3498db',
    [ROLES.COMPTABLE]: '#27ae60',
    [ROLES.ENSEIGNANT]: '#9b59b6'
  };
  return colors[role] || '#95a5a6';
};
