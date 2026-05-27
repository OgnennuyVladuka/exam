import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Authorization from './pages/Authorization'
import Registration from './pages/Registration'
import NewApplication from './pages/NewApplication'
import PersonalAccount from './pages/PersonalAccount'
import AdminPanel from './pages/AdminPanel'

function AppContent() {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/authorization" />} />
          <Route path="/authorization" element={<Authorization />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/new-application" element={user ? <NewApplication /> : <Navigate to="/authorization" />} />
          <Route path="/personal-account" element={user ? <PersonalAccount /> : <Navigate to="/authorization" />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/authorization" />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
