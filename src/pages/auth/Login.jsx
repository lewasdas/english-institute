import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import './Login.css'

const ROLE_DASHBOARDS = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

export default function Login() {
  const { login, role } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Completá email y contraseña')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('Bienvenido!')
      // Role will be set by AuthContext after login; navigate based on it
      // We wait a tick so context updates
      setTimeout(() => {
        const dest = ROLE_DASHBOARDS[role] || '/'
        navigate(dest, { replace: true })
      }, 300)
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">HappyFaces</h1>
          <p className="login-subtitle">Instituto de Inglés</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Ingresando...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
