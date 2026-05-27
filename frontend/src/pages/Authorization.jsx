import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../css/Authorization.css'

export default function Authorization() {
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  /* Состояние формы и загрузки */
  const [formData, setFormData] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /* Обработка изменения полей */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  /* Отправка формы — вход в систему */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.login.trim() || !formData.password.trim()) {
      return setError('Пожалуйста, заполните все поля')
    }

    setIsLoading(true)
    try {
      const user = await authLogin(formData.login, formData.password)
      if (user?.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/personal-account', { replace: true })
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Неверный логин или пароль')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex align-items-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
            
            <div className="card auth-card shadow-lg border-0 rounded-4 animate-fade-in-up">
              <div className="card-body p-4 p-md-5">
                
                {/* Заголовок */}
                <div className="text-center mb-4">
                  <h1 className="h4 fw-bold text-dark mb-1">Вход</h1>
                </div>

                {/* Форма входа */}
                <form onSubmit={handleSubmit} noValidate className="auth-form">
                  
                  {/* Поле логина */}
                  <div className="form-floating mb-3">
                    <input
                      id="login"
                      name="login"
                      type="text"
                      className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                      placeholder="Введите логин"
                      value={formData.login}
                      onChange={handleChange}
                      autoComplete="username"
                      disabled={isLoading}
                    />
                    <label htmlFor="login" className="form-label">Логин</label>
                  </div>

                  {/* Поле пароля */}
                  <div className="form-floating mb-3">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                      placeholder="Введите пароль"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <label htmlFor="password" className="form-label">Пароль</label>
                  </div>

                  {/* Сообщение об ошибке */}
                  {error && (
                    <div className="alert alert-danger py-2 px-3 small text-center animate-shake" role="alert">
                      {error}
                    </div>
                  )}

                  {/* Кнопка входа */}
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100 py-3 mt-2 fw-semibold auth-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    {isLoading ? 'Вход...' : 'Войти'}
                  </button>
                </form>

                {/* Ссылка на регистрацию */}
                <div className="text-center mt-4 pt-2">
                  <Link to="/registration" className="text-decoration-none">
                    <span className="text-muted small">Еще не зарегистрированы?</span>{' '}
                    <span className="fw-medium text-primary link-hover">Регистрация</span>
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}