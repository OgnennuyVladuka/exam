import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  /* Восстановление сессии при загрузке */
  useEffect(() => {
    const restoreSession = () => {
      const savedUser = localStorage.getItem('auth_user')
      const savedToken = localStorage.getItem('auth_token')
      
      if (savedUser && savedToken && savedToken.startsWith('eyJ')) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (e) {
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_token')
        }
      } else {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
      }
    }
    restoreSession()
    setIsLoading(false)
  }, [])

  /* Вход в систему */
  const login = async (login, password) => {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || 'Неверный логин или пароль')
    }
    
    if (!data.token || !data.token.startsWith('eyJ')) {
      console.error('[Auth] Server returned invalid token:', data.token)
      throw new Error('Сервер вернул невалидный токен')
    }
    
    setUser(data.user)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    localStorage.setItem('auth_token', data.token)
    
    return data.user
  }

  /* Регистрация с автоматическим входом */
  const register = async (userData) => {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка регистрации')
    }

    await login(userData.login, userData.password)
    return user
  }

  /* Выход из системы */
  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  /* Заголовки для авторизованных запросов */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    
    return {
      'Content-Type': 'application/json',
      'Authorization': (token && token.startsWith('eyJ')) ? `Bearer ${token}` : ''
    }
  }

  /* Проверка роли администратора */
  const isAdmin = user?.role === 'ADMIN'

  const value = { 
    user, 
    isAdmin, 
    isLoading, 
    login, 
    logout, 
    register,
    getAuthHeaders
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/* Хук для использования контекста авторизации */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}