import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../css/PersonalAccount.css'

/* Маппинги статусов и способов оплаты */
const STATUS_MAP = {
  NEW: 'Новая',
  ASSIGNED: 'Мероприятие назначено',
  COMPLETED: 'Мероприятие завершено'
}
const PAYMENT_MAP = {
  CARD: 'Банковская карта',
  CASH: 'Наличные',
  ONLINE_TRANSFER: 'Онлайн-перевод'
}
const STATUS_COLOR = {
  NEW: 'info',
  ASSIGNED: 'warning',
  COMPLETED: 'success'
}

export default function PersonalAccount() {
  const { user, getAuthHeaders, logout } = useAuth()
  const navigate = useNavigate()
  
  /* Список бронирований пользователя */
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  /* Состояние формы отзыва */
  const [reviewForm, setReviewForm] = useState({ bookingId: null, rating: 5, content: '' })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /* Загрузка заявок пользователя */
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings/me', { headers: getAuthHeaders() })
        if (res.status === 401) { logout(); navigate('/authorization', { replace: true }); return }
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || 'Не удалось загрузить данные')
        }
        const data = await res.json()
        setBookings(data)
      } catch (err) {
        console.error('Ошибка загрузки заявок:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [getAuthHeaders, logout, navigate])

  /* Отправка отзыва */
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (reviewForm.content.trim() && reviewForm.content.trim().length < 10) {
      alert('Текст отзыва должен содержать минимум 10 символов')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewForm.bookingId,
          rating: reviewForm.rating,
          content: reviewForm.content.trim() || null
        })
      })
      const data = await res.json()
      if (res.status === 401) { logout(); navigate('/authorization', { replace: true }); return }
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки отзыва')

      setBookings(prev => prev.map(b =>
        b.id === reviewForm.bookingId 
          ? { ...b, review: { ...b.review, content: reviewForm.content.trim() || null, rating: reviewForm.rating, createdAt: new Date().toISOString() } } 
          : b
      ))
      setShowReviewForm(false)
      setReviewForm({ bookingId: null, rating: 5, content: '' })
    } catch (err) {
      console.error('Ошибка отправки отзыва:', err)
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /* Слайдер */
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    'https://picsum.photos/seed/conf1/800/400',
    'https://picsum.photos/seed/conf2/800/400',
    'https://picsum.photos/seed/conf3/800/400',
    'https://picsum.photos/seed/conf4/800/400'
  ]
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 3000)
    return () => clearInterval(timer)
  }, [])
  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)

  /* Экран загрузки */
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="text-muted">Загрузка данных...</p>
        </div>
      </div>
    )
  }
  
  /* Экран ошибки */
  if (error) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="alert alert-danger text-center shadow-sm" role="alert">
                <p className="mb-3 fw-medium">⚠️ {error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-outline-danger">
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="account-page bg-gradient py-4 py-md-5">
      <div className="container">
        <div className="row justify-content-center animate-fade-in-up">
          <div className="col-12">
            
            {/* Заголовок страницы */}
            <header className="text-center mb-4 mb-md-5">
              <h1 className="h3 h-md-2 fw-bold text-dark mb-1">Личный кабинет</h1>
              <p className="text-primary fw-medium mb-0">
                Добро пожаловать, {user?.fullName || user?.login}!
              </p>
            </header>

            {/* Слайдер */}
            <section className="slider-section mb-4 mb-md-5">
              <div className="slider-container position-relative rounded-4 overflow-hidden shadow-lg bg-light">
                <div 
                  className="slider-track d-flex transition-transform" 
                  style={{ transform: `translateX(-${currentSlide * 100}%)`, transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                >
                  {slides.map((src, i) => (
                    <img 
                      key={i} 
                      src={src} 
                      alt={`Слайд ${i + 1}`} 
                      className="slide-image w-100 flex-shrink-0"
                      style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ))}
                </div>
                <button className="slider-btn prev position-absolute top-50 start-0 translate-middle-y btn btn-light btn-sm rounded-circle shadow-sm" onClick={prevSlide} aria-label="Предыдущий слайд">
                  ‹
                </button>
                <button className="slider-btn next position-absolute top-50 end-0 translate-middle-y btn btn-light btn-sm rounded-circle shadow-sm" onClick={nextSlide} aria-label="Следующий слайд">
                  ›
                </button>
                <div className="slider-dots position-absolute bottom-0 start-50 translate-middle-x d-flex gap-2 pb-3">
                  {slides.map((_, i) => (
                    <button 
                      key={i} 
                      className={`dot btn btn-sm p-0 border-0 rounded-circle ${i === currentSlide ? 'active bg-white' : 'bg-white bg-opacity-50'}`}
                      style={{ width: '10px', height: '10px' }}
                      onClick={() => setCurrentSlide(i)}
                      aria-label={`Перейти к слайду ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Список заявок */}
            <section className="bookings-section">
              <h2 className="h4 fw-bold text-dark mb-3 mb-md-4">История заявок</h2>
              
              {bookings.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5 animate-fade-in-up">
                  <p className="text-muted mb-3">У вас пока нет заявок.</p>
                  <Link to="/new-application" className="btn btn-primary px-4">
                    Создать первую заявку →
                  </Link>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 g-3 g-md-4">
                  {bookings.map(booking => (
                    <div key={booking.id} className="col">
                      <div className="card h-100 border-0 shadow-sm rounded-4 booking-card-hover">
                        <div className="card-body d-flex flex-column">
                          
                          <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                            <h3 className="h6 fw-bold mb-0 text-dark">{booking.room?.name || 'Помещение'}</h3>
                            <span className={`badge bg-${STATUS_COLOR[booking.status] || 'secondary'} rounded-pill px-3 py-2`}>
                              {STATUS_MAP[booking.status] || booking.status}
                            </span>
                          </div>
                          
                          <div className="booking-details text-secondary small mb-3">
                            <p className="mb-2">📅 {new Date(booking.startDate).toLocaleDateString('ru-RU')}</p>
                            <p className="mb-0">💳 {PAYMENT_MAP[booking.paymentMethod] || booking.paymentMethod}</p>
                          </div>

                          {booking.review ? (
                            <div className="review-integrated bg-light border rounded-3 p-3 mt-auto animate-slide-in">
                              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                <span className="fw-semibold small text-dark">Ваш отзыв</span>
                                <div className="d-flex align-items-center gap-1">
                                  <div className="stars-display d-inline-flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <span 
                                        key={star} 
                                        className={star <= booking.review.rating ? 'star-filled text-warning' : 'star-empty text-secondary'}
                                        style={{ fontSize: '0.9rem' }}
                                      >★</span>
                                    ))}
                                  </div>
                                  <span className="small text-muted">({booking.review.rating}/5)</span>
                                </div>
                              </div>
                              {booking.review.content && (
                                <p className="review-content small text-secondary fst-italic mb-2">
                                  «{booking.review.content}»
                                </p>
                              )}
                              {booking.review.createdAt && (
                                <small className="text-muted d-block">
                                  {new Date(booking.review.createdAt).toLocaleDateString('ru-RU')}
                                </small>
                              )}
                            </div>
                          ) : booking.status === 'COMPLETED' ? (
                            <button
                              className="btn btn-success w-100 mt-auto review-btn-hover"
                              onClick={() => { 
                                setShowReviewForm(true)
                                setReviewForm(prev => ({ ...prev, bookingId: booking.id }))
                              }}
                            >
                              Оставить отзыв
                            </button>
                          ) : (
                            <div className="alert alert-light small text-center mb-0 py-2 border-0">
                              Отзыв можно оставить после завершения мероприятия
                            </div>
                          )}
                          
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* Форма отзыва */}
      {showReviewForm && (
        <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3 animate-fade-in" style={{ zIndex: 1050 }} onClick={() => setShowReviewForm(false)}>
          <div className="review-modal card border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="card-body p-4">
              <button 
                className="btn-close position-absolute top-0 end-0 m-3" 
                onClick={() => setShowReviewForm(false)}
                aria-label="Закрыть"
              />
              
              <h3 className="h5 fw-bold text-center mb-4">Оставить отзыв</h3>
              
              <form onSubmit={handleSubmitReview}>
                <label className="form-label fw-medium">Оценка:</label>
                <div className="rating-stars d-flex gap-2 mb-3" role="radiogroup" aria-label="Выберите оценку">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`btn btn-sm p-0 border-0 bg-transparent rating-star ${star <= reviewForm.rating ? 'active' : ''}`}
                      style={{ fontSize: '1.75rem', color: star <= reviewForm.rating ? '#fbbf24' : '#e5e7eb', transition: 'all 0.2s ease' }}
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      aria-pressed={star === reviewForm.rating}
                    >★</button>
                  ))}
                </div>
                
                <label className="form-label fw-medium">Ваш комментарий:</label>
                <textarea
                  className="form-control mb-2"
                  value={reviewForm.content}
                  onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Расскажите о вашем опыте... (необязательно)"
                  minLength={reviewForm.content.trim() ? 10 : 0}
                  maxLength={500}
                  rows={4}
                />
                <small className="text-muted d-block text-end">{reviewForm.content.length}/500</small>
                
                <div className="d-flex gap-2 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowReviewForm(false)} 
                    disabled={submitting}
                    className="btn btn-secondary flex-grow-1"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting || (reviewForm.content.trim() && reviewForm.content.trim().length < 10)}
                    className="btn btn-primary flex-grow-1"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Отправка...
                      </>
                    ) : 'Отправить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}