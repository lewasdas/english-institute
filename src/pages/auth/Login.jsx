import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock, GraduationCap, BookOpen } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import './Login.css'

const ROLES = [
  {
    key: 'student',
    label: 'Alumno',
    icon: GraduationCap,
    color: '#10B981',
  },
  {
    key: 'teacher',
    label: 'Profesor',
    icon: BookOpen,
    color: '#4F46E5',
  },
]

const ROLE_DASHBOARDS = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

export default function Login() {
  const { login, role } = useAuth()
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Cuando el rol se setea en el contexto, navegamos
  useEffect(() => {
    if (role) {
      const dest = ROLE_DASHBOARDS[role] || '/'
      navigate(dest, { replace: true })
    }
  }, [role, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Completá email y contraseña')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('¡Bienvenido!')
    } catch (err) {
      toast.error(err.message || 'Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.jpg" alt="Logo" className="login-logo-img" />
          <h1 className="login-brand">HappyFaces</h1>
          <p className="login-subtitle">Instituto de Inglés</p>
        </div>

        {!selectedRole ? (
          <>
            <p className="role-prompt">¿Quién sos?</p>
            <div className="role-grid">
              {ROLES.map(({ key, label, icon: Icon, description, color }) => (
                <button
                  key={key}
                  className="role-card"
                  style={{ '--role-color': color }}
                  onClick={() => setSelectedRole(key)}
                >
                  <div className="role-icon">
                    <Icon size={28} />
                  </div>
                  <span className="role-label">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="role-selected-badge" style={{
              '--role-color': ROLES.find(r => r.key === selectedRole)?.color
            }}>
              {(() => {
                const r = ROLES.find(r => r.key === selectedRole)
                const Icon = r.icon
                return <><Icon size={16} /> {r.label}</>
              })()}
              <button className="role-change" onClick={() => setSelectedRole(null)}>
                Cambiar
              </button>
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
                    autoFocus
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
          </>
        )}
      </div>
    </div>
  )
}
