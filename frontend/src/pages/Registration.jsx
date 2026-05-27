import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../css/Registration.css'

/* Форматирование телефона для UI */
const formatPhone = (value) => {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('7') || digits.startsWith('8')) {
    digits = digits.substring(1)
  }
  if (digits.length > 10) digits = digits.substring(0, 10)
  
  const part1 = digits.substring(0, 3)
  const part2 = digits.substring(3, 6)
  const part3 = digits.substring(6, 8)
  const part4 = digits.substring(8, 10)
  
  let result = '+7'
  if (part1) result += ` (${part1}`
  if (part1?.length === 3) result += ')'
  if (part2) result += ` ${part2}`
  if (part3) result += `-${part3}`
  if (part4) result += `-${part4}`
  
  return result
}

/* Очистка телефона для отправки на бэкенд */
const cleanPhone = (value) => value.replace(/\D/g, '').replace(/^([78])/, '')

export default function Registration() {
  const { register } = useAuth()
  const navigate = useNavigate()
  
  /* Данные формы */
  const [formData, setFormData] = useState({
    fullName: '', login: '', password: '', email: '', phone: ''
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  /* Обработка фокуса на поле телефона */
  const handlePhoneFocus = (e) => {
    if (!e.target.value.trim()) {
      setFormData(prev => ({ ...prev, phone: '+7 (' }))
    }
  }

  /* Валидация формы */
  const validate = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Обязательное поле'
    if (!/^[a-zA-Z0-9]{6,}$/.test(formData.login)) 
      newErrors.login = 'Логин: 6+ символов, только латиница и цифры'
    if (formData.password.length < 8) 
      newErrors.password = 'Минимум 8 символов'
    if (!/\S+@\S+\.\S+/.test(formData.email)) 
      newErrors.email = 'Некорректный формат email'
    const phoneDigits = cleanPhone(formData.phone)
    if (phoneDigits.length !== 10) 
      newErrors.phone = 'Введите 10 цифр номера'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /* Обработка изменения полей */
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const formatted = formatPhone(value)
      setFormData(prev => ({ ...prev, phone: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  /* Отправка формы — регистрация */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const payload = { ...formData, phone: cleanPhone(formData.phone) }
      await register(payload)
      setSuccess(true)
      setTimeout(() => navigate('/personal-account'), 1500)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  /* Экран успеха */
  if (success) {
    return (
      <div className="auth-page d-flex align-items-center min-vh-100 py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
              <div className="card border-0 shadow-lg rounded-4 text-center p-4 animate-fade-in-up">
                <div className="display-4 mb-3 animate-pop-in">🎉</div>
                <h3 className="fw-bold mb-2">Регистрация успешна!</h3>
                <p className="text-muted mb-3">
                  Добро пожаловать, {formData.fullName.split(' ')[0]}!
                </p>
                <small className="text-primary fw-medium">
                  Переход в личный кабинет...
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* Основная форма */
  return (
    <div className="auth-page d-flex align-items-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
            
            <div className="card auth-card border-0 shadow-lg rounded-4 animate-fade-in-up">
              <div className="card-body p-4 p-md-5">
                
                {/* Заголовок */}
                <div className="text-center mb-4">
                  <h1 className="h4 fw-bold text-dark mb-1">Регистрация</h1>
                </div>

                {/* Форма регистрации */}
                <form onSubmit={handleSubmit} noValidate className="auth-form">
                  
                  {/* Поле ФИО */}
                  <div className="form-floating mb-3">
                    <input
                      id="fullName" name="fullName" type="text"
                      className={`form-control form-control-lg ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="Иванов Иван Иванович"
                      value={formData.fullName} onChange={handleChange}
                      autoComplete="name" disabled={isLoading}
                    />
                    <label htmlFor="fullName" className="form-label">ФИО</label>
                    {errors.fullName && (
                      <div className="invalid-feedback d-block">{errors.fullName}</div>
                    )}
                  </div>

                  {/* Поле логина */}
                  <div className="form-floating mb-3">
                    <input
                      id="login" name="login" type="text"
                      className={`form-control form-control-lg ${errors.login ? 'is-invalid' : ''}`}
                      placeholder="user123456"
                      value={formData.login} onChange={handleChange}
                      autoComplete="username" disabled={isLoading}
                    />
                    <label htmlFor="login" className="form-label">Логин</label>
                    {errors.login && (
                      <div className="invalid-feedback d-block">{errors.login}</div>
                    )}
                  </div>

                  {/* Поле пароля */}
                  <div className="form-floating mb-3">
                    <input
                      id="password" name="password" type="password"
                      className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={formData.password} onChange={handleChange}
                      autoComplete="new-password" disabled={isLoading}
                    />
                    <label htmlFor="password" className="form-label">Пароль</label>
                    {errors.password && (
                      <div className="invalid-feedback d-block">{errors.password}</div>
                    )}
                  </div>

                  {/* Поле Email */}
                  <div className="form-floating mb-3">
                    <input
                      id="email" name="email" type="email"
                      className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="example@mail.ru"
                      value={formData.email} onChange={handleChange}
                      autoComplete="email" disabled={isLoading}
                    />
                    <label htmlFor="email" className="form-label">E-mail</label>
                    {errors.email && (
                      <div className="invalid-feedback d-block">{errors.email}</div>
                    )}
                  </div>

                  {/* Поле телефона */}
                  <div className="form-floating mb-3">
                    <input
                      id="phone" name="phone" type="tel"
                      className={`form-control form-control-lg ${errors.phone ? 'is-invalid' : ''}`}
                      placeholder="+7 (___) ___-__-__"
                      value={formData.phone} onChange={handleChange}
                      onFocus={handlePhoneFocus}
                      autoComplete="tel" disabled={isLoading}
                    />
                    <label htmlFor="phone" className="form-label">Телефон</label>
                    {errors.phone && (
                      <div className="invalid-feedback d-block">{errors.phone}</div>
                    )}
                  </div>

                  {/* Сообщение об ошибке */}
                  {serverError && (
                    <div className="alert alert-danger py-2 px-3 small text-center animate-shake mb-3" role="alert">
                      {serverError}
                    </div>
                  )}

                  {/* Кнопка регистрации */}
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100 py-3 mt-2 fw-semibold auth-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </button>
                </form>

                {/* Ссылка на вход */}
                <div className="text-center mt-4 pt-2">
                  <Link to="/authorization" className="text-decoration-none">
                    <span className="text-muted small">Уже есть аккаунт?</span>{' '}
                    <span className="fw-medium text-primary link-hover">Войти</span>
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