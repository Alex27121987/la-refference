import { useState, useEffect } from 'react';
import { 
  getUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  ROLES, 
  getRoleLabel, 
  getRoleColor 
} from '../utils/userManagement';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: ROLES.ENSEIGNANT,
    assignedClasses: []
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers.filter(u => u.active));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.fullName || !formData.role) {
      setMessage('❌ Veuillez remplir tous les champs obligatoires');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      if (editingUser) {
        // Mise à jour
        updateUser(editingUser.id, formData);
        setMessage('✅ Utilisateur modifié avec succès');
      } else {
        // Ajout
        addUser(formData);
        setMessage('✅ Utilisateur ajouté avec succès');
      }

      setShowForm(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Erreur : ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      assignedClasses: user.assignedClasses || []
    });
    setShowForm(true);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      deleteUser(userId);
      setMessage('✅ Utilisateur désactivé');
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: ROLES.ENSEIGNANT,
      assignedClasses: []
    });
  };

  const handleAddClass = () => {
    setFormData({
      ...formData,
      assignedClasses: [
        ...formData.assignedClasses,
        { sectionName: 'Primaire', className: '1ère' }
      ]
    });
  };

  const handleRemoveClass = (index) => {
    const newClasses = [...formData.assignedClasses];
    newClasses.splice(index, 1);
    setFormData({ ...formData, assignedClasses: newClasses });
  };

  const handleClassChange = (index, field, value) => {
    const newClasses = [...formData.assignedClasses];
    newClasses[index][field] = value;
    setFormData({ ...formData, assignedClasses: newClasses });
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>👥 Gestion des Utilisateurs</h1>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            resetForm();
          }}
        >
          ➕ Ajouter un utilisateur
        </button>
      </div>

      {message && (
        <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? '✏️ Modifier l\'utilisateur' : '➕ Nouvel utilisateur'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>✖</button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nom d'utilisateur *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ex: jdupont"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mot de passe *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nom complet *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="ex: Jean Dupont"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ex: jdupont@larefference.cd"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Rôle *</label>
                <div className="role-selector">
                  {Object.values(ROLES).map(role => (
                    <button
                      key={role}
                      type="button"
                      className={`role-option ${formData.role === role ? 'active' : ''}`}
                      style={{ 
                        borderColor: formData.role === role ? getRoleColor(role) : '#ccc',
                        background: formData.role === role ? getRoleColor(role) + '20' : 'transparent'
                      }}
                      onClick={() => setFormData({ ...formData, role })}
                    >
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              {formData.role === ROLES.ENSEIGNANT && (
                <div className="form-group">
                  <label>Classes assignées</label>
                  <div className="assigned-classes">
                    {formData.assignedClasses.map((cls, index) => (
                      <div key={index} className="class-row">
                        <select
                          value={cls.sectionName}
                          onChange={(e) => handleClassChange(index, 'sectionName', e.target.value)}
                        >
                          <option value="Maternelle">Maternelle</option>
                          <option value="Primaire">Primaire</option>
                          <option value="Secondaire">Secondaire</option>
                        </select>

                        <select
                          value={cls.className}
                          onChange={(e) => handleClassChange(index, 'className', e.target.value)}
                        >
                          {cls.sectionName === 'Maternelle' && (
                            <>
                              <option value="1ère Mat">1ère Mat</option>
                              <option value="2ème Mat">2ème Mat</option>
                              <option value="3ème Mat">3ème Mat</option>
                            </>
                          )}
                          {cls.sectionName === 'Primaire' && (
                            <>
                              <option value="1ère">1ère</option>
                              <option value="2ème">2ème</option>
                              <option value="3ème">3ème</option>
                              <option value="4ème">4ème</option>
                              <option value="5ème">5ème</option>
                              <option value="6ème">6ème</option>
                            </>
                          )}
                          {cls.sectionName === 'Secondaire' && (
                            <>
                              <option value="7EB">7EB</option>
                              <option value="8EB">8EB</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                            </>
                          )}
                        </select>

                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveClass(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn-add-class"
                      onClick={handleAddClass}
                    >
                      ➕ Ajouter une classe
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? '💾 Enregistrer' : '➕ Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom d'utilisateur</th>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Classes assignées</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td><strong>{user.username}</strong></td>
                <td>{user.fullName}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span 
                    className="role-badge"
                    style={{ background: getRoleColor(user.role) + '30', color: getRoleColor(user.role) }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  {user.assignedClasses && user.assignedClasses.length > 0 ? (
                    <div className="assigned-badges">
                      {user.assignedClasses.map((cls, idx) => (
                        <span key={idx} className="class-badge">
                          {cls.sectionName} - {cls.className}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ opacity: 0.5 }}>Toutes les classes</span>
                  )}
                </td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => handleEdit(user)}>✏️</button>
                  <button className="btn-delete" onClick={() => handleDelete(user.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
