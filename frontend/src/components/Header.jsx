import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import MobileNav from './MobileNav'
import '../css/Header.css'

// Основной компонент шапки сайта
export default function Header() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Обработчик выхода из системы
  const handleLogout = () => {
    logout()
    navigate('/authorization')
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className="header navbar navbar-dark sticky-top shadow-sm">
        <div className="container-fluid px-3 px-md-4">
          {/* Логотип */}
          <Link to={user ? '/personal-account' : '/authorization'} className="navbar-brand fw-bold header__logo animate-fade-in">
            Конференции.РФ
          </Link>

          {/* Кнопка гамбургер */}
          <button 
            className="navbar-toggler border-0 mobile-toggle-btn" 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Десктопное меню */}
          <div className="desktop-nav">
            {!user ? (
              <div className="d-flex align-items-center gap-2">
                <Link to="/authorization" className={`btn btn-sm px-3 header__btn ${location.pathname === '/authorization' ? 'active' : ''}`}>Вход</Link>
                <Link to="/registration" className={`btn btn-sm btn-outline-light px-3 header__btn ${location.pathname === '/registration' ? 'active' : ''}`}>Регистрация</Link>
              </div>
            ) : isAdmin ? (
              <button onClick={handleLogout} className="btn btn-sm btn-outline-light px-3 header__btn header__btn--logout">Выход</button>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex gap-2">
                  <Link to="/new-application" className={`nav-link header__link ${location.pathname === '/new-application' ? 'active' : ''}`}>Новая заявка</Link>
                  <Link to="/personal-account" className={`nav-link header__link ${location.pathname === '/personal-account' ? 'active' : ''}`}>Личный кабинет</Link>
                </div>
                <button onClick={handleLogout} className="btn btn-sm btn-outline-light px-3 header__btn header__btn--logout">Выход</button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Мобильное меню */}
      <MobileNav 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        location={location}
      />
    </>
  )
}