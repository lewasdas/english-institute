import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { api } from '../../lib/api.js'
import './Store.css'

export default function Store() {
  const { user, balance } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchasing, setPurchasing] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api('get', '/api/store/items')
      .then(({ data }) => setItems(data))
      .catch(() => setError('No se pudo cargar la tienda.'))
      .finally(() => setLoading(false))
  }, [])

  const handlePurchase = async (item) => {
    setPurchasing(item.id)
    try {
      await api('post', '/api/store/purchase', { itemId: item.id })
      showToast('success', `¡Canjeaste "${item.name}"! 🎉`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al canjear el item.'
      showToast('error', msg)
    } finally {
      setPurchasing(null)
    }
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content store-content">
        <button className="back-btn" onClick={() => navigate('/student/dashboard')}>
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="store-header">
          <div>
            <h1 className="store-title">Tienda 🛍️</h1>
            <p className="store-subtitle">Canjea tus HappyFaces por premios</p>
          </div>
          <div className="store-balance">
            <span>Tu saldo</span>
            <strong>{balance} HF 😊</strong>
          </div>
        </div>

        {toast && (
          <div className={`store-toast store-toast--${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        )}

        {loading ? (
          <div className="store-loader">
            <Loader2 size={32} className="spin" />
            <p>Cargando tienda...</p>
          </div>
        ) : error ? (
          <div className="store-error">{error}</div>
        ) : items.length === 0 ? (
          <div className="store-empty">
            <ShoppingBag size={48} />
            <p>La tienda está vacía por ahora.</p>
          </div>
        ) : (
          <div className="store-grid">
            {items.map(item => {
              const canAfford = balance >= item.price
              const isBuying = purchasing === item.id
              return (
                <div key={item.id} className={`store-card ${!canAfford ? 'store-card--locked' : ''}`}>
                  <div className="store-card-img">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="store-card-placeholder">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div className="store-card-body">
                    <h3 className="store-card-name">{item.name}</h3>
                    {item.description && (
                      <p className="store-card-desc">{item.description}</p>
                    )}
                    <div className="store-card-footer">
                      <span className="store-card-price">{item.price} HF 😊</span>
                      <button
                        className={`store-card-btn ${canAfford ? 'store-card-btn--active' : 'store-card-btn--disabled'}`}
                        onClick={() => canAfford && handlePurchase(item)}
                        disabled={!canAfford || isBuying || purchasing !== null}
                      >
                        {isBuying ? (
                          <Loader2 size={16} className="spin" />
                        ) : canAfford ? 'Canjear' : 'Sin saldo'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
