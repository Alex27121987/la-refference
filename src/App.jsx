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
  const [menuOpen, setMenuOpen] = useState(false)

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
          <button 
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1 className="app-title">🏫 LA DIFFERENCE</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="user-info">
              👤 {user?.fullName || user?.username}
            </span>
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              🚪
            </button>
          </div>
        </div>
      </nav>

      {/* Menu latéral hamburger */}
      <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>📋 Menu</h2>
            <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
          <ul className="sidebar-links">
            <li>
              <button 
                className={currentPage === 'dashboard' ? 'active' : ''} 
                onClick={() => { 
                  setCurrentPage('dashboard'); 
                  setSelectedClass(null); 
                  setMenuOpen(false);
                }}
              >
                🏠 Accueil
              </button>
            </li>
            {hasPermission(user, PERMISSIONS.ADD_PAYMENTS) && (
              <li>
                <button 
                  className={currentPage === 'payment' ? 'active' : ''} 
                  onClick={() => { 
                    setCurrentPage('payment'); 
                    setMenuOpen(false);
                  }}
                >
                  💰 Saisie Paiement
                </button>
              </li>
            )}
            {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
              <li>
                <button 
                  className={currentPage === 'users' ? 'active' : ''} 
                  onClick={() => { 
                    setCurrentPage('users'); 
                    setMenuOpen(false);
                  }}
                >
                  👥 Utilisateurs
                </button>
              </li>
            )}
          </ul>
          <div className="sidebar-footer">
            <p style={{ fontSize: '12px', opacity: 0.7 }}>
              Rôle: <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      </div>

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
        <p>&copy; 2026 LA DIFFERENCE - Système de Gestion Scolaire</p>
      </footer>
    </div>
  )
}

export default App
