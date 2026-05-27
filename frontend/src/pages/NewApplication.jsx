import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../css/NewApplication.css'

const PAYMENT_MAP = {
  CARD: 'Банковская карта',
  CASH: 'Наличные',
  ONLINE_TRANSFER: 'Онлайн-перевод'
}

export default function NewApplication() {
  const navigate = useNavigate()
  const { user, getAuthHeaders, logout } = useAuth()

  /* Список помещений */
  const [rooms, setRooms] = useState([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  
  /* Данные формы */
  const [formData, setFormData] = useState({
    roomId: '', startDate: '', paymentMethod: ''
  })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState(null)
  const [serverError, setServerError] = useState('')

  /* Загрузка списка помещений */
  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => { setRooms(data); setIsLoadingRooms(false) })
      .catch(() => setServerError('Не удалось загрузить список помещений'))
  }, [])

  /* Обработка изменения полей */
  const handleChange = (e) => {
    const { name, value, type } = e.target
    if (name === 'startDate' && type === 'date') {
      if (!value) { setFormData(prev => ({ ...prev, startDate: '' })); return }
      const [year, month, day] = value.split('-')
      setFormData(prev => ({ ...prev, startDate: `${day}.${month}.${year}` }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  /* Валидация формы */
  const validate = () => {
    const newErrors = {}
    if (!formData.roomId) newErrors.roomId = 'Выберите помещение'
    if (!formData.startDate) {
      newErrors.startDate = 'Укажите дату'
    } else {
      const [day, month, year] = formData.startDate.split('.').map(Number)
      const inputDate = new Date(year, month - 1, day)
      const today = new Date(); today.setHours(0,0,0,0)
      if (inputDate < today) newErrors.startDate = 'Дата не может быть в прошлом'
    }
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Выберите способ оплаты'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /* Отправка формы — создание заявки */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitStatus('loading'); setServerError('')
    try {
      const [day, month, year] = formData.startDate.split('.').map(Number)
      const isoDate = new Date(year, month - 1, day).toISOString()
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: formData.roomId, startDate: isoDate, paymentMethod: formData.paymentMethod })
      })
      if (res.status === 401) { logout(); navigate('/authorization', { replace: true }); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка при создании заявки')
      setSubmitStatus('success')
      setTimeout(() => navigate('/personal-account'), 1800)
    } catch (err) {
      console.error('Ошибка:', err)
      setServerError(err.message); setSubmitStatus('error')
    }
  }

  /* Экран успеха */
  if (submitStatus === 'success') {
    return (
      <div className="app-page d-flex align-items-center min-vh-100 py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
              <div className="card border-0 shadow-lg rounded-4 text-center p-4 animate-fade-in-up">
                <div className="display-3 mb-3 animate-pop-in">📅</div>
                <h3 className="fw-bold mb-2">Заявка успешно создана!</h3>
                <p className="text-muted mb-4">Она отправлена на согласование администратору</p>
                <Link to="/personal-account" className="btn btn-outline-secondary px-4 py-2">
                  Перейти в кабинет
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* Основная форма */
  return (
    <div className="app-page d-flex align-items-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            
            <div className="card form-card border-0 shadow-lg rounded-4 animate-fade-in-up">
              <div className="card-body p-4 p-md-5">
                
                <div className="text-center mb-4">
                  <h1 className="h4 fw-bold text-dark mb-1">Новая заявка</h1>
                  <p className="text-primary fw-medium small mb-0">Выберите помещение и удобное время</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  
                  {/* Помещение */}
                  <div className="mb-3">
                    <label htmlFor="roomId" className="form-label fw-medium">Помещение</label>
                    {isLoadingRooms ? (
                      <div className="form-select text-muted py-3">Загрузка...</div>
                    ) : (
                      <select
                        id="roomId" name="roomId"
                        className={`form-select form-select-lg ${errors.roomId ? 'is-invalid' : ''}`}
                        value={formData.roomId} onChange={handleChange}
                        disabled={submitStatus === 'loading'}
                      >
                        <option value="" disabled>Выберите помещение</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} ({room.type === 'AUDITORIUM' ? 'Аудитория' : room.type === 'COWORKING' ? 'Коворкинг' : 'Кинозал'})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.roomId && <div className="invalid-feedback d-block">{errors.roomId}</div>}
                  </div>

                  {/* Дата */}
                  <div className="mb-3">
                    <label htmlFor="startDate" className="form-label fw-medium">Дата начала конференции</label>
                    <input
                      id="startDate" name="startDate" type="date"
                      className={`form-control form-control-lg ${errors.startDate ? 'is-invalid' : ''}`}
                      value={formData.startDate ? formData.startDate.split('.').reverse().join('-') : ''}
                      onChange={handleChange}
                      disabled={submitStatus === 'loading'}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <small className="form-text text-muted">Выберите дату в календаре</small>
                    {errors.startDate && <div className="invalid-feedback d-block">{errors.startDate}</div>}
                  </div>

                  {/* Способ оплаты */}
                  <div className="mb-4">
                    <label htmlFor="paymentMethod" className="form-label fw-medium">Способ оплаты</label>
                    <select
                      id="paymentMethod" name="paymentMethod"
                      className={`form-select form-select-lg ${errors.paymentMethod ? 'is-invalid' : ''}`}
                      value={formData.paymentMethod} onChange={handleChange}
                      disabled={submitStatus === 'loading'}
                    >
                      <option value="" disabled>Выберите способ</option>
                      {Object.entries(PAYMENT_MAP).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {errors.paymentMethod && <div className="invalid-feedback d-block">{errors.paymentMethod}</div>}
                  </div>

                  {/* Ошибка сервера */}
                  {serverError && (
                    <div className="alert alert-danger py-2 px-3 small text-center animate-shake mb-3" role="alert">
                      {serverError}
                    </div>
                  )}

                  {/* Кнопки */}
                  <div className="d-flex gap-2 flex-column flex-sm-row">
                    <button 
                      type="button" 
                      onClick={() => navigate('/personal-account')} 
                      className="btn btn-outline-secondary btn-lg py-2 flex-grow-1 order-2 order-sm-1"
                    >
                      Назад
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg py-2 fw-semibold flex-grow-2 order-1 order-sm-2 app-btn"
                      disabled={submitStatus === 'loading'}
                    >
                      {submitStatus === 'loading' ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      ) : null}
                      {submitStatus === 'loading' ? 'Отправка...' : 'Отправить заявку'}
                    </button>
                  </div>

                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}