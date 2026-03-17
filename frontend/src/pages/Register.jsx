import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const PASSWORD_MIN = 6

export default function Register() {
  const [form, setForm] = useState({
    username:    '',
    email:       '',
    password:    '',
    confirm:     '',
    contactInfo: '',
  })
  const [errors,  setErrors]  = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    // Limpiar error del campo al escribir
    setErrors((er) => { const n = { ...er }; delete n[name]; return n })
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim())              e.username = 'El nombre de usuario es obligatorio'
    if (form.username.trim().length < 3)    e.username = 'Mínimo 3 caracteres'
    if (!form.email.trim())                 e.email    = 'El email es obligatorio'
    if (!form.password)                     e.password = 'La contraseña es obligatoria'
    if (form.password.length < PASSWORD_MIN) e.password = `Mínimo ${PASSWORD_MIN} caracteres`
    if (form.password !== form.confirm)     e.confirm  = 'Las contraseñas no coinciden'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return }

    setLoading(true)
    try {
      await register(form.username.trim(), form.email.trim(), form.password, form.contactInfo.trim())
      navigate('/collection', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < PASSWORD_MIN) return { label: 'Muy corta', color: 'bg-red-500',    width: '25%'  }
    if (p.length < 8)            return { label: 'Débil',     color: 'bg-orange-400', width: '50%'  }
    if (p.length < 12)           return { label: 'Buena',     color: 'bg-yellow-400', width: '75%'  }
    return                              { label: 'Fuerte',    color: 'bg-green-400',  width: '100%' }
  })()

  return (
    <div className="min-h-[calc(100vh-57px)] bg-[var(--color-surface)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Título */}
        <div className="text-center mb-8 space-y-1">
          <p className="text-4xl">✨</p>
          <h1 className="text-2xl font-bold text-white">Crea tu cuenta</h1>
          <p className="text-sm text-gray-500">Gratis · Sin tarjeta de crédito</p>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4 shadow-xl">

          {apiError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                text-red-400 text-sm rounded-xl px-4 py-2.5"
            >
              <AlertCircle size={15} className="shrink-0" />
              {apiError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username */}
            <FormField
              icon={<User size={15} />}
              label="Nombre de usuario"
              type="text"
              name="username"
              placeholder="ej: MagoRojo99"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              autoComplete="username"
            />

            {/* Email */}
            <FormField
              icon={<Mail size={15} />}
              label="Email"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            {/* Contraseña */}
            <div className="space-y-1.5">
              <FormField
                icon={<Lock size={15} />}
                label="Contraseña"
                type="password"
                name="password"
                placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="new-password"
              />
              {/* Barra de fortaleza */}
              {passwordStrength && (
                <div className="px-0.5 space-y-1">
                  <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${passwordStrength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength.width }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600">{passwordStrength.label}</p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <FormField
              icon={
                form.confirm && form.password === form.confirm
                  ? <CheckCircle2 size={15} className="text-green-500" />
                  : <Lock size={15} />
              }
              label="Confirmar contraseña"
              type="password"
              name="confirm"
              placeholder="Repite tu contraseña"
              value={form.confirm}
              onChange={handleChange}
              error={errors.confirm}
              autoComplete="new-password"
            />

            {/* Contacto (opcional) */}
            <div className="space-y-1.5">
              <FormField
                icon={<Phone size={15} />}
                label={
                  <span className="flex items-center gap-1.5">
                    Contacto para trades
                    <span className="text-gray-700 font-normal">(opcional)</span>
                  </span>
                }
                type="text"
                name="contactInfo"
                placeholder="Discord, WhatsApp, Telegram…"
                value={form.contactInfo}
                onChange={handleChange}
                autoComplete="off"
              />
              <p className="text-[10px] text-gray-700 pl-0.5">
                Se muestra a otros jugadores en los resultados del Trade Finder
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2
                bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-1"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Creando cuenta…</>
                : 'Crear cuenta gratis'
              }
            </button>
          </form>

          <div className="border-t border-[var(--color-border)] pt-4 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[var(--color-brand)] hover:text-violet-400 font-medium transition-colors">
              Inicia sesión
            </Link>
          </div>
        </div>

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

function FormField({ icon, label, type, name, placeholder, value, onChange, error, autoComplete }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400 pl-0.5">{label}</label>
      <div className="relative">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none
          ${error ? 'text-red-500' : 'text-gray-600'}`}>
          {icon}
        </span>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`w-full bg-[var(--color-surface)] rounded-xl
            pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-700
            focus:outline-none transition-colors border
            ${error
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-[var(--color-border)] focus:border-[var(--color-brand)]'
            }`}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 pl-0.5"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}