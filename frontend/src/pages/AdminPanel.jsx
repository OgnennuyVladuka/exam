import { useState, useEffect, useCallback } from 'react'
import '../css/AdminPanel.css'

const STATUS_OPTIONS = ['NEW', 'ASSIGNED', 'COMPLETED']
const STATUS_LABELS = { NEW: 'Новая', ASSIGNED: 'Мероприятие назначено', COMPLETED: 'Мероприятие завершено' }
const PAYMENT_MAP = { CARD: 'Карта', CASH: 'Наличные', ONLINE_TRANSFER: 'Перевод' }

const ADMIN_HEADERS = {
  'login': 'Admin26',
  'password': 'Demo20'
}

export default function AdminPanel() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1, total: 0 })
  const [filters, setFilters] = useState({ status: '', sort: 'createdAt' })
  const [toast, setToast] = useState(null)

  /* Показать уведомление */
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* Загрузка данных */
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 6, sort: filters.sort })
      if (filters.status) params.append('status', filters.status)

      const res = await fetch(`/api/admin/bookings?${params}`, { headers: ADMIN_HEADERS })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки')
      setBookings(data.bookings)
      setPagination(data.pagination)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  /* Смена статуса бронирования */
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setBookings(prev => prev.map(b => b.id === bookingId ? data.booking : b))
      showToast(`Статус изменён на "${STATUS_LABELS[newStatus]}"`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  /* Форматирование даты ДД.ММ.ГГГГ */
  const formatDate = (iso) => {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
  }

  if (loading) return <div className="loader-page"><div className="spinner-large"></div>Загрузка заявок...</div>

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1>⚙️ Панель администратора</h1>
          <p>Управление заявками на бронирование</p>
        </header>

        {/* Фильтры и сортировка */}
        <div className="admin-controls">
          <div className="control-group">
            <label>Статус:</label>
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}>
              <option value="">Все</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Сортировка:</label>
            <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
              <option value="createdAt">По дате создания</option>
              <option value="startDate">По дате конференции</option>
            </select>
          </div>
        </div>

        {/* Таблица бронирований */}
        <div className="admin-table-wrapper">
          {bookings.length === 0 ? (
            <div className="empty-state">Нет заявок с выбранными фильтрами</div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Помещение</th>
                    <th>Дата</th>
                    <th>Оплата</th>
                    <th>Статус</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className={`status-row status-${b.status.toLowerCase()}`}>
                      <td data-label="Пользователь">
                        <div className="user-cell">
                          <strong>{b.user?.fullName || b.user?.login}</strong>
                          <span className="subtext">{b.user?.email}</span>
                        </div>
                      </td>
                      <td data-label="Помещение">{b.room?.name || '—'}</td>
                      <td data-label="Дата">{formatDate(b.startDate)}</td>
                      <td data-label="Оплата">{PAYMENT_MAP[b.paymentMethod] || b.paymentMethod}</td>
                      <td data-label="Статус">
                        <span className={`status-badge badge-${b.status.toLowerCase()}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td data-label="Действие">
                        <select
                          value={b.status}
                          onChange={e => handleStatusChange(b.id, e.target.value)}
                          className="status-select"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Пагинация */}
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
                <span>Страница {page} из {pagination.pages}</span>
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast уведомления */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}
    </div>
  )
}