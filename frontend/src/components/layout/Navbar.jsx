import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Library, Wand2, ArrowLeftRight } from 'lucide-react'

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

      {user && (
        <div className="flex items-center gap-6">
          <Link to="/collection" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <Library size={16} /> Colección
          </Link>
          <Link to="/deck-builder" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <Wand2 size={16} /> Deck Builder
          </Link>
          <Link to="/trade-finder" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <ArrowLeftRight size={16} /> Trade Finder
          </Link>

          <span className="text-sm text-gray-500">{user.username}</span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      )}
    </nav>
  )
}