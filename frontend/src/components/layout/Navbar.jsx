import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Library, Wand2, ArrowLeftRight, LogIn, UserPlus } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-[var(--color-brand)]">
        MTG Trade Finder
      </Link>

      <div className="flex items-center gap-6">
        {/* Siempre visible */}
        <Link
          to="/deck-builder"
          className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Wand2 size={16} /> Deck Builder
        </Link>

        {user ? (
          <>
            <Link
              to="/collection"
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <Library size={16} /> Colección
            </Link>
            <Link
              to="/trade-finder"
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeftRight size={16} /> Trade Finder
            </Link>
            <span className="text-sm text-gray-500">{user.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={16} /> Salir
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <LogIn size={16} /> Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 text-sm text-[var(--color-brand)] hover:text-violet-400 transition-colors font-medium"
            >
              <UserPlus size={16} /> Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}