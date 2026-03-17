import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    navigate(isAuthenticated ? '/collection' : '/login', { replace: true })
  }, [isAuthenticated, navigate])

  return null
}