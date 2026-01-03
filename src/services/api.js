// Service API pour communiquer avec le backend
// À mettre à jour avec l'URL réelle du serveur

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Élèves
  students: {
    getAll: async () => {
      // return fetch(`${API_BASE_URL}/students`)
      //   .then(r => r.json());
      console.log('[API] GET /students');
    },
    getById: async (id) => {
      // return fetch(`${API_BASE_URL}/students/${id}`)
      //   .then(r => r.json());
      console.log(`[API] GET /students/${id}`);
    },
    create: async (data) => {
      // return fetch(`${API_BASE_URL}/students`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // }).then(r => r.json());
      console.log('[API] POST /students', data);
    },
    update: async (id, data) => {
      // return fetch(`${API_BASE_URL}/students/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // }).then(r => r.json());
      console.log(`[API] PUT /students/${id}`, data);
    },
    delete: async (id) => {
      // return fetch(`${API_BASE_URL}/students/${id}`, { method: 'DELETE' })
      //   .then(r => r.json());
      console.log(`[API] DELETE /students/${id}`);
    }
  },

  // Paiements
  payments: {
    getByStudent: async (studentId) => {
      // return fetch(`${API_BASE_URL}/payments/student/${studentId}`)
      //   .then(r => r.json());
      console.log(`[API] GET /payments/student/${studentId}`);
    },
    getAll: async () => {
      // return fetch(`${API_BASE_URL}/payments`)
      //   .then(r => r.json());
      console.log('[API] GET /payments');
    },
    create: async (data) => {
      // return fetch(`${API_BASE_URL}/payments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // }).then(r => r.json());
      console.log('[API] POST /payments', data);
    },
    update: async (id, data) => {
      // return fetch(`${API_BASE_URL}/payments/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // }).then(r => r.json());
      console.log(`[API] PUT /payments/${id}`, data);
    },
    delete: async (id) => {
      // return fetch(`${API_BASE_URL}/payments/${id}`, { method: 'DELETE' })
      //   .then(r => r.json());
      console.log(`[API] DELETE /payments/${id}`);
    }
  },

  // Authentification
  auth: {
    login: async (username, password) => {
      // return fetch(`${API_BASE_URL}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // }).then(r => r.json());
      console.log('[API] POST /auth/login', { username });
    },
    logout: async () => {
      // return fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
      //   .then(r => r.json());
      console.log('[API] POST /auth/logout');
    },
    getProfile: async () => {
      // return fetch(`${API_BASE_URL}/auth/profile`)
      //   .then(r => r.json());
      console.log('[API] GET /auth/profile');
    }
  },

  // Statistiques
  stats: {
    getSummary: async () => {
      // return fetch(`${API_BASE_URL}/stats/summary`)
      //   .then(r => r.json());
      console.log('[API] GET /stats/summary');
    },
    getByClass: async (classId) => {
      // return fetch(`${API_BASE_URL}/stats/class/${classId}`)
      //   .then(r => r.json());
      console.log(`[API] GET /stats/class/${classId}`);
    }
  }
};

export default api;
