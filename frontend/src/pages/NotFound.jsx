import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">Página no encontrada</h1>
        <p className="notfound-message">
          La página que buscás no existe o fue movida.
        </p>
        <Link to="/" className="btn btn-primary notfound-btn">
          <Home size={16} />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
