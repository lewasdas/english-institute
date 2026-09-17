import { useState, useEffect } from 'react'
import { Plus, Gift, X, Loader2, UserPlus } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import './Users.css'

const ROLE_LABELS = { student: 'Alumno', teacher: 'Profesor', admin: 'Admin' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Assign HF modal
  const [assignModal, setAssignModal] = useState(null) // { user }
  const [assignAmount, setAssignAmount] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  // Create user modal
  const [createModal, setCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    api('get', '/api/admin?resource=users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAssign = async () => {
    if (!assignAmount || Number(assignAmount) === 0) return
    setAssigning(true)
    setAssignError('')
    try {
      await api('post', '/api/wallet', {
        action: 'assign',
        studentId: assignModal.user.id,
        amount: Number(assignAmount),
        reason: assignNote.trim() || 'Asignación manual',
      })
      setUsers(prev => prev.map(u =>
        u.id === assignModal.user.id ? { ...u, balance: (u.balance ?? 0) + Number(assignAmount) } : u
      ))
      setAssignModal(null)
      setAssignAmount('')
      setAssignNote('')
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Error al asignar HappyFaces.')
    } finally {
      setAssigning(false)
    }
  }

  const handleCreate = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) {
      setCreateError('El email y la contraseña son obligatorios.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const { data } = await api('post', '/api/admin?resource=users', newUser)
      setUsers(prev => [...prev, data])
      setCreateModal(false)
      setNewUser({ full_name: '', email: '', password: '', role: 'student' })
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error al crear usuario.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content admin-users-content">
        <div className="admin-users-header">
          <div>
            <h1 className="admin-users-title">Usuarios</h1>
            <p className="admin-users-subtitle">{users.length} usuarios registrados</p>
          </div>
          <button className="create-user-btn" onClick={() => setCreateModal(true)}>
            <UserPlus size={18} />
            Crear usuario
          </button>
        </div>

        {loading ? (
          <div className="users-loader"><Loader2 size={28} className="spin" /> Cargando...</div>
        ) : error ? (
          <div className="users-error">{error}</div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Saldo HF</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="user-name">{user.full_name || '—'}</td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      <span className={`user-role-badge user-role-badge--${user.role}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="user-balance">{user.balance ?? 0} HF</td>
                    <td>
                      {user.role === 'student' && (
                        <button
                          className="give-hf-btn"
                          onClick={() => { setAssignModal({ user }); setAssignAmount(''); setAssignNote(''); setAssignError('') }}
                        >
                          <Gift size={14} />
                          Dar HF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assign HF Modal */}
        {assignModal && (
          <div className="modal-overlay" onClick={() => setAssignModal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Dar HappyFaces 😊</h3>
                <button className="modal-close" onClick={() => setAssignModal(null)}><X size={20} /></button>
              </div>
              <p className="modal-subtitle">Para: <strong>{assignModal.user.full_name || assignModal.user.email}</strong></p>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Cantidad de HF</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ej: 10"
                    value={assignAmount}
                    onChange={e => setAssignAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nota (opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Premio por participación"
                    value={assignNote}
                    onChange={e => setAssignNote(e.target.value)}
                  />
                </div>
              </div>
              {assignError && <div className="modal-error">{assignError}</div>}
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={() => setAssignModal(null)}>Cancelar</button>
                <button
                  className="modal-btn-primary"
                  onClick={handleAssign}
                  disabled={assigning || !assignAmount}
                >
                  {assigning ? <><Loader2 size={16} className="spin" /> Asignando...</> : `Dar ${assignAmount || '...'} HF`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {createModal && (
          <div className="modal-overlay" onClick={() => setCreateModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Crear Usuario</h3>
                <button className="modal-close" onClick={() => setCreateModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Juan Pérez"
                    value={newUser.full_name}
                    onChange={e => setNewUser(u => ({ ...u, full_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="usuario@email.com"
                    value={newUser.email}
                    onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Contraseña segura"
                    value={newUser.password}
                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-input"
                    value={newUser.role}
                    onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                  >
                    <option value="student">Alumno</option>
                    <option value="teacher">Profesor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {createError && <div className="modal-error">{createError}</div>}
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={() => setCreateModal(false)}>Cancelar</button>
                <button
                  className="modal-btn-primary"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? <><Loader2 size={16} className="spin" /> Creando...</> : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
