import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const login    = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      navigate('/collection', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-[var(--color-surface)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Logo / título */}
        <div className="text-center mb-8 space-y-1">
          <p className="text-4xl">🃏</p>
          <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
          <p className="text-sm text-gray-500">Inicia sesión para acceder a tu colección</p>
        </div>

        {/* Card del formulario */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                text-red-400 text-sm rounded-xl px-4 py-2.5"
            >
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              icon={<Mail size={15} />}
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              label="Email"
              autoComplete="email"
            />
            <FormField
              icon={<Lock size={15} />}
              type="password"
              name="password"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={handleChange}
              label="Contraseña"
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="w-full flex items-center justify-center gap-2
                bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Entrando…</>
                : 'Iniciar sesión'
              }
            </button>
          </form>

          <div className="border-t border-[var(--color-border)] pt-4 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-[var(--color-brand)] hover:text-violet-400 font-medium transition-colors">
              Regístrate gratis
            </Link>
          </div>
        </div>

        {/* Volver al deck builder sin cuenta */}
        <p className="text-center mt-4 text-xs text-gray-700">
          ¿Solo quieres armar un mazo?{' '}
          <Link to="/deck-builder" className="text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2">
            Continuar sin cuenta
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

function FormField({ icon, label, type, name, placeholder, value, onChange, autoComplete }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400 pl-0.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
          {icon}
        </span>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
            pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-700
            focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
      </div>
    </div>
  )
}