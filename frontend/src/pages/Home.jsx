import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wand2, Library, ArrowLeftRight, Sparkles,
  Users, TrendingUp, Shield, ChevronRight, Star
} from 'lucide-react'
import { useAuthStore }       from '../store/authStore'
import { useCollectionStore } from '../store/collectionStore'

// ── Animación de entrada escalonada ──────────────────────────
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Cartas decorativas de fondo ───────────────────────────────
const DECO_CARDS = [
  { id: 'bbe2da43-f0ba-4e1b-96a8-fa3b58cc8b89', rotate: '-8deg',  x: '-5%',  y: '5%',  z: 1  },
  { id: '5f7b5e6e-0a21-4866-9bc8-7ecbef6c2c38', rotate: '6deg',   x: '78%',  y: '2%',  z: 2  },
  { id: 'e61e6820-1be1-4e1d-9096-97d862a36eba', rotate: '-4deg',  x: '88%',  y: '55%', z: 1  },
  { id: '5f69e9f5-6615-4f3b-a9b3-4f9b9d4bf4df', rotate: '10deg',  x: '-8%',  y: '62%', z: 2  },
]

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const { entries, fetchCollection } = useCollectionStore()

  useEffect(() => {
    if (isAuthenticated) fetchCollection()
  }, [isAuthenticated, fetchCollection])

  return (
    <div className="min-h-[calc(100vh-57px)] bg-[var(--color-surface)] overflow-x-hidden">
      {isAuthenticated
        ? <HomeLoggedIn  user={user} entries={entries} />
        : <HomeAnonymous />
      }
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// VISTA ANÓNIMA — Landing page
// ════════════════════════════════════════════════════════════════
function HomeAnonymous() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTABottom />
    </>
  )
}

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center
      px-4 pt-20 pb-24 overflow-hidden min-h-[75vh]">

      {/* Gradiente de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[700px] h-[700px] bg-[var(--color-brand)] opacity-[0.07] rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64
          bg-violet-900 opacity-20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48
          bg-indigo-900 opacity-20 rounded-full blur-2xl" />
      </div>

      {/* Cartas decorativas flotantes */}
      {DECO_CARDS.map((c, i) => (
        <motion.img
          key={c.id}
          src={`https://cards.scryfall.io/normal/front/${c.id[0]}/${c.id[1]}/${c.id}.jpg`}
          alt=""
          aria-hidden
          initial={{ opacity: 0, rotate: c.rotate, scale: 0.85 }}
          animate={{ opacity: 0.18, rotate: c.rotate, scale: 1,
            y: [0, -8, 0], transition: {
              opacity: { duration: 0.8, delay: 0.3 + i * 0.1 },
              scale:   { duration: 0.8, delay: 0.3 + i * 0.1 },
              y: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 },
            }
          }}
          style={{
            position: 'absolute',
            left: c.x, top: c.y,
            width: 140,
            borderRadius: 12,
            zIndex: c.z,
            pointerEvents: 'none',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ))}

      {/* Contenido central */}
      <div className="relative z-10 max-w-2xl space-y-6">
        <motion.div {...fadeUp(0.1)}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium
            bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30
            rounded-full px-3 py-1 mb-4"
          >
            <Sparkles size={11} /> Encuentra tus cartas faltantes
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight tracking-tight">
            Arma tu mazo.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Encuentra el trade.
            </span>
          </h1>
        </motion.div>

        <motion.p {...fadeUp(0.2)} className="text-lg text-gray-400 leading-relaxed max-w-lg mx-auto">
          Construye mazos de Magic gratis, registra tu colección y conecta con jugadores
          que tienen las cartas que te faltan.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/deck-builder"
            className="group flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
              text-white font-semibold px-7 py-3.5 rounded-2xl transition-all text-sm shadow-lg
              shadow-[var(--color-brand)]/30 hover:shadow-[var(--color-brand)]/50 hover:scale-[1.02]"
          >
            <Wand2 size={16} /> Construir mazo gratis
            <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 border border-[var(--color-border)] hover:border-gray-500
              text-gray-400 hover:text-white font-medium px-7 py-3.5 rounded-2xl transition-all text-sm"
          >
            Crear cuenta gratis
          </Link>
        </motion.div>

        <motion.p {...fadeUp(0.4)} className="text-xs text-gray-700">
          Sin tarjeta de crédito · Sin instalación · 100% gratuito
        </motion.p>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: <Wand2 size={22} />,
    color: 'text-violet-400',
    bg:    'bg-violet-400/10',
    title: 'Deck Builder',
    desc:  'Arma mazos completos buscando cualquier carta de Magic. Disponible sin cuenta.',
  },
  {
    icon: <Library size={22} />,
    color: 'text-blue-400',
    bg:    'bg-blue-400/10',
    title: 'Tu Colección',
    desc:  'Registra las cartas que tienes. Se usa para marcar ✅/⚠️ en cada mazo que armes.',
  },
  {
    icon: <ArrowLeftRight size={22} />,
    color: 'text-green-400',
    bg:    'bg-green-400/10',
    title: 'Trade Finder',
    desc:  '¿Te falta una carta? Encontramos qué jugador de la comunidad la tiene para tradear.',
  },
  {
    icon: <Shield size={22} />,
    color: 'text-yellow-400',
    bg:    'bg-yellow-400/10',
    title: 'Datos reales',
    desc:  'Precios actualizados desde Scryfall. Sin datos desactualizados ni estimaciones inventadas.',
  },
]

function FeaturesSection() {
  return (
    <section className="px-4 py-16 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-[var(--color-card)] border border-[var(--color-border)]
              rounded-2xl p-5 space-y-3 hover:border-[var(--color-brand)]/40 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.color} flex items-center justify-center
              group-hover:scale-110 transition-transform`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-white text-sm">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

const STEPS = [
  { n: '01', title: 'Arma tu mazo', desc: 'Busca cartas con filtros por color, tipo, CMC y formato. Sin cuenta.' },
  { n: '02', title: 'Revisa el resumen', desc: 'Ve qué cartas tienes y cuáles te faltan. Costo estimado en USD.' },
  { n: '03', title: 'Encuentra el trade', desc: 'El Trade Finder te muestra qué jugadores tienen lo que necesitas.' },
  { n: '04', title: 'Contacta y tradea', desc: 'Usa el contacto registrado de cada jugador para coordinar el intercambio.' },
]

function HowItWorksSection() {
  return (
    <section className="px-4 py-16 bg-[var(--color-card)] border-y border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-2"
        >
          <h2 className="text-2xl font-bold text-white">¿Cómo funciona?</h2>
          <p className="text-sm text-gray-500">Cuatro pasos para conseguir las cartas que te faltan</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-3"
            >
              <span className="text-3xl font-black text-[var(--color-brand)]/30">{s.n}</span>
              <h4 className="font-semibold text-white text-sm">{s.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABottom() {
  return (
    <section className="px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto space-y-6"
      >
        <h2 className="text-3xl font-black text-white">
          Empieza a tradear hoy
        </h2>
        <p className="text-sm text-gray-500">
          Únete a la comunidad, registra tu colección y aparece en los resultados de otros jugadores.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
              text-white font-semibold px-8 py-3 rounded-2xl transition-all text-sm
              shadow-lg shadow-[var(--color-brand)]/25 hover:scale-[1.02]"
          >
            <Star size={14} /> Crear cuenta gratis
          </Link>
          <Link
            to="/deck-builder"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300
              text-sm transition-colors"
          >
            Probar sin cuenta <ChevronRight size={14} />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// VISTA LOGUEADA — Dashboard
// ════════════════════════════════════════════════════════════════
function HomeLoggedIn({ user, entries }) {
  const totalCards  = entries.reduce((a, e) => a + e.quantity, 0)
  const uniqueCards = entries.length

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Buenos días' :
    hour < 19 ? 'Buenas tardes' :
    'Buenas noches'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

      {/* Saludo */}
      <motion.div {...fadeUp(0.05)} className="space-y-1">
        <p className="text-sm text-gray-600">{greeting},</p>
        <h1 className="text-3xl font-black text-white">
          {user?.username} <span className="wave inline-block">👋</span>
        </h1>
      </motion.div>

      {/* Stats rápidas */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Library size={18} className="text-blue-400" />}
          label="Cartas únicas"
          value={uniqueCards}
          sub="en tu colección"
          color="blue"
        />
        <StatCard
          icon={<Layers18 />}
          label="Total de cartas"
          value={totalCards}
          sub="contando copias"
          color="violet"
        />
        <StatCard
          icon={<ArrowLeftRight size={18} className="text-green-400" />}
          label="Trade Finder"
          value="Activo"
          sub="apareces en búsquedas"
          color="green"
          isText
        />
      </motion.div>

      {/* Accesos rápidos */}
      <motion.div {...fadeUp(0.15)} className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
          Accesos rápidos
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <QuickLink
            to="/deck-builder"
            icon={<Wand2 size={20} className="text-violet-400" />}
            bg="bg-violet-400/8"
            border="border-violet-400/20 hover:border-violet-400/50"
            title="Deck Builder"
            desc="Armar o continuar un mazo"
          />
          <QuickLink
            to="/collection"
            icon={<Library size={20} className="text-blue-400" />}
            bg="bg-blue-400/8"
            border="border-blue-400/20 hover:border-blue-400/50"
            title="Mi Colección"
            desc={uniqueCards > 0 ? `${uniqueCards} cartas registradas` : 'Empezar a registrar cartas'}
          />
          <QuickLink
            to="/trade-finder"
            icon={<ArrowLeftRight size={20} className="text-green-400" />}
            bg="bg-green-400/8"
            border="border-green-400/20 hover:border-green-400/50"
            title="Trade Finder"
            desc="Ver quién tiene lo que buscas"
          />
        </div>
      </motion.div>

      {/* Últimas cartas de la colección */}
      {entries.length > 0 && (
        <motion.div {...fadeUp(0.2)} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
              Últimas agregadas
            </h2>
            <Link to="/collection" className="text-xs text-[var(--color-brand)] hover:text-violet-400 transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {entries.slice(-10).reverse().map((entry) => {
              const imageUrl = `https://cards.scryfall.io/normal/front/${entry.scryfallId[0]}/${entry.scryfallId[1]}/${entry.scryfallId}.jpg`
              return (
                <motion.div
                  key={entry.scryfallId}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="shrink-0"
                >
                  <img
                    src={imageUrl}
                    alt={entry.cardName}
                    title={entry.cardName}
                    className="w-20 rounded-lg shadow-md"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Onboarding si la colección está vacía */}
      {entries.length === 0 && (
        <motion.div
          {...fadeUp(0.2)}
          className="border border-dashed border-[var(--color-border)] rounded-2xl p-8
            flex flex-col items-center text-center space-y-4"
        >
          <p className="text-4xl">📦</p>
          <div className="space-y-1">
            <h3 className="font-semibold text-white">Registra tu primera carta</h3>
            <p className="text-sm text-gray-600 max-w-sm">
              Agrega las cartas que tienes y aparecerás en el Trade Finder cuando otro jugador las busque.
            </p>
          </div>
          <Link
            to="/collection"
            className="flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
              text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Library size={14} /> Ir a mi colección
          </Link>
        </motion.div>
      )}
    </div>
  )
}

// ── Micro-componentes del dashboard ───────────────────────────

function StatCard({ icon, label, value, sub, color, isText }) {
  const colors = {
    blue:   'border-blue-400/20   bg-blue-400/5',
    violet: 'border-violet-400/20 bg-violet-400/5',
    green:  'border-green-400/20  bg-green-400/5',
  }
  return (
    <div className={`border ${colors[color]} rounded-2xl p-4 space-y-2`}>
      {icon}
      <p className={`font-black leading-none ${isText ? 'text-2xl' : 'text-3xl'} text-white`}>
        {value}
      </p>
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="text-[10px] text-gray-700">{sub}</p>
      </div>
    </div>
  )
}

function QuickLink({ to, icon, bg, border, title, desc }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 ${bg} border ${border}
        rounded-2xl p-4 transition-all hover:scale-[1.01]`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-white">{title}</p>
        <p className="text-xs text-gray-600 truncate">{desc}</p>
      </div>
      <ChevronRight size={14} className="ml-auto text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" />
    </Link>
  )
}

// Ícono de layers sin importar Layers (no existe en lucide 0.400 con ese nombre exacto)
function Layers18() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-violet-400"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  )
}