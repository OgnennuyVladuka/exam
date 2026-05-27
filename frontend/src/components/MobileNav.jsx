import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../css/Header.css'

// Мобильное навигационное меню
function MobileNav({ isOpen, onClose, user, isAdmin, onLogout, location }) {
  // Обработка нажатия Escape и блокировка скролла
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="header__mobile-overlay d-flex justify-content-center align-items-start" onClick={onClose}>
      <div 
        className="header__mobile-menu card border-0 shadow-lg rounded-4 animate-slide-down" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок меню */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-white border-opacity-25">
          <span className="text-white fw-semibold fs-5">Меню</span>
          <button 
            className="btn btn-sm btn-outline-light rounded-3 d-flex align-items-center justify-content-center header__mobile-close" 
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Ссылки меню */}
        <nav className="p-3 d-flex flex-column gap-2">
          {!user ? (
            <div className="d-flex flex-column gap-2">
              <Link 
                to="/authorization" 
                className={`btn btn-light btn-sm py-2 fw-medium header__btn ${location.pathname === '/authorization' ? 'active' : ''}`}
                onClick={onClose}
              >
                Вход
              </Link>
              <Link 
                to="/registration" 
                className={`btn btn-outline-light btn-sm py-2 fw-medium header__btn ${location.pathname === '/registration' ? 'active' : ''}`}
                onClick={onClose}
              >
                Регистрация
              </Link>
            </div>
          ) : isAdmin ? (
            <button 
              onClick={onLogout} 
              className="btn btn-outline-light btn-sm py-2 fw-medium header__btn header__btn--logout"
            >
              Выход
            </button>
          ) : (
            <div className="d-flex flex-column gap-2">
              <Link 
                to="/new-application" 
                className={`btn btn-outline-light btn-sm py-2 fw-medium text-start header__link ${location.pathname === '/new-application' ? 'active' : ''}`}
                onClick={onClose}
              >
                Новая заявка
              </Link>
              <Link 
                to="/personal-account" 
                className={`btn btn-outline-light btn-sm py-2 fw-medium text-start header__link ${location.pathname === '/personal-account' ? 'active' : ''}`}
                onClick={onClose}
              >
                Личный кабинет
              </Link>
              <button 
                onClick={onLogout} 
                className="btn btn-outline-light btn-sm py-2 fw-medium header__btn header__btn--logout mt-1"
              >
                Выход
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}

export default MobileNav