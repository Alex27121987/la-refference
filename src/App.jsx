import { useEffect, useState } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PaymentEntry from './pages/PaymentEntry'
import FinancialSituation from './pages/FinancialSituation'
import ClassDetail from './pages/ClassDetail'
import UserManagement from './pages/UserManagement'
import { hasPermission, PERMISSIONS, canAccessClass } from './utils/userManagement'

function App() {
  const [user, setUser] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lr_user') : null
    return saved ? JSON.parse(saved) : null
  })
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedClass, setSelectedClass] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lr_selected_class') : null
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentPage('dashboard')
  }

  useEffect(() => {
    if (user) {
      localStorage.setItem('lr_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('lr_user')
    }
  }, [user])

  useEffect(() => {
    if (selectedClass) {
      localStorage.setItem('lr_selected_class', JSON.stringify(selectedClass))
    } else {
      localStorage.removeItem('lr_selected_class')
    }
  }, [selectedClass])

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('dashboard')
    setSelectedClass(null)
    localStorage.removeItem('lr_selected_class')
  }

  const handleSelectClass = (sectionName, className) => {
    // Vérifier si l'utilisateur a accès à cette classe
    if (!canAccessClass(user, sectionName, className)) {
      alert('❌ Vous n\'avez pas accès à cette classe');
      return;
    }
    setSelectedClass({ sectionName, className })
    setCurrentPage('class-detail')
  }

  // Si pas connecté, afficher la page de login
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="app-title">🏫 LA RÉFÉRENCE</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'space-between' }}>
            <ul className="nav-links">
              <li><button 
                className={currentPage === 'dashboard' ? 'active' : ''} 
                onClick={() => { setCurrentPage('dashboard'); setSelectedClass(null); }}
              >
                🏠 Accueil
              </button></li>
              {hasPermission(user, PERMISSIONS.ADD_PAYMENTS) && (
                <li><button 
                  className={currentPage === 'payment' ? 'active' : ''} 
                  onClick={() => setCurrentPage('payment')}
                >
                  💰 Saisie Paiement
                </button></li>
              )}
              {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                <li><button 
                  className={currentPage === 'users' ? 'active' : ''} 
                  onClick={() => setCurrentPage('users')}
                >
                  👥 Utilisateurs
                </button></li>
              )}
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#ecf0f1', fontSize: '14px' }}>
                👤 {user?.fullName || user?.username} <span style={{ opacity: 0.7 }}>({user?.role})</span>
              </span>
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && !selectedClass && (
          <Dashboard user={user} onSelectClass={handleSelectClass} />
        )}
        {currentPage === 'class-detail' && selectedClass && (
          <ClassDetail
            sectionName={selectedClass.sectionName}
            className={selectedClass.className}
            onBack={() => { setSelectedClass(null); setCurrentPage('dashboard'); }}
            onOpenSituation={() => setCurrentPage('situation')}
            user={user}
          />
        )}
        {currentPage === 'payment' && (
          <PaymentEntry 
            onOpenSituation={() => setCurrentPage('situation')}
            onSelectClass={(section, classe) => {
              setSelectedClass({ sectionName: section, className: classe });
              setCurrentPage('situation');
            }}
            user={user}
          />
        )}
        {currentPage === 'situation' && (
          <FinancialSituation
            selectedClass={selectedClass}
            onBack={() => setCurrentPage(selectedClass ? 'class-detail' : 'dashboard')}
            user={user}
          />
        )}
        {currentPage === 'users' && hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
          <UserManagement />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 LA RÉFÉRENCE - Système de Gestion Scolaire</p>
      </footer>
    </div>
  )
}

export default App
