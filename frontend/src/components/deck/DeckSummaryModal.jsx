import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  X, Save, UserPlus, LogIn, Loader2, CheckCircle2,
  AlertCircle, DollarSign, Layers,
} from 'lucide-react'
import { useDeckStore }       from '../../store/deckStore'
import { useAuthStore }       from '../../store/authStore'
import { useCollectionStore } from '../../store/collectionStore'
import api from '../../services/api'

export default function DeckSummaryModal({ onClose }) {
  const { cards, deckName, format, clearDeck } = useDeckStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const collection      = useCollectionStore((s) => s.entries)

  const [tradeData,    setTradeData]    = useState(null)
  const [tradeLoading, setTradeLoading] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [savedOk,      setSavedOk]      = useState(false)
  const [saveError,    setSaveError]    = useState(null)

  // ── Métricas del mazo ──────────────────────────────────────
  const totalCards = cards.reduce((a, c) => a + c.quantity, 0)

  const totalUSD = cards.reduce((a, c) => {
    const p = parseFloat(c.prices?.usd ?? c.prices?.usd_foil ?? 0)
    return a + p * c.quantity
  }, 0)

  const ownedIds  = new Set(collection.map((e) => e.scryfallId))
  const owned     = isAuthenticated ? cards.filter((c) => ownedIds.has(c.scryfallId))    : []
  const missing   = isAuthenticated ? cards.filter((c) => !ownedIds.has(c.scryfallId))   : cards

  const ownedQty   = owned.reduce((a, c) => a + c.quantity, 0)
  const missingQty = missing.reduce((a, c) => a + c.quantity, 0)

  // ── Llamar Trade Finder ────────────────────────────────────
  useEffect(() => {
    if (missing.length === 0) return

    const oracleIds = [...new Set(missing.map((c) => c.oracleId).filter(Boolean))]
    if (oracleIds.length === 0) return

    setTradeLoading(true)
    api.post('/trade/who-has', { oracleIds })
      .then(({ data }) => setTradeData(data))
      .catch(() => setTradeData(null))
      .finally(() => setTradeLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Guardar mazo (usuarios autenticados) ───────────────────
  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await api.post('/decks', {
        name:   deckName,
        format: format || null,
        cards:  cards.map((c) => ({
          scryfallId: c.scryfallId,
          oracleId:   c.oracleId,
          cardName:   c.cardName,
          quantity:   c.quantity,
        })),
      })
      setSavedOk(true)
    } catch (err) {
      setSaveError(err.response?.data?.message ?? 'Error al guardar el mazo')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndClose = async () => {
    await handleSave()
    clearDeck()
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 24 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.95, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl
          w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{deckName || 'Mi mazo'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalCards} cartas · {format ? format.charAt(0).toUpperCase() + format.slice(1) : 'Sin formato'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo: 2 columnas ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">

            {/* ── Columna izquierda: Vista previa ─────────── */}
            <div className="p-5 space-y-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Vista previa del mazo
              </h3>

              {/* Stats rápidas */}
              <div className="grid grid-cols-3 gap-2">
                <MiniStat icon={<Layers size={13}/>} label="Cartas"    value={totalCards}            />
                <MiniStat icon={<DollarSign size={13}/>} label="Costo est." value={`$${totalUSD.toFixed(2)}`} green />
                {isAuthenticated && (
                  <MiniStat label="Tienes" value={`${ownedQty}/${totalCards}`} blue />
                )}
              </div>

              {/* Lista de cartas */}
              <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                {cards.map((card) => {
                  const isOwned = isAuthenticated && ownedIds.has(card.scryfallId)
                  const cardUSD = parseFloat(card.prices?.usd ?? card.prices?.usd_foil ?? 0)
                  return (
                    <div key={card.scryfallId} className="flex items-center gap-2 py-1 group/cl">
                      {card.imageUri && (
                        <img
                          src={card.imageUri}
                          alt={card.cardName}
                          className="w-6 h-8 rounded object-cover object-top shrink-0 opacity-80 group-hover/cl:opacity-100 transition-opacity"
                        />
                      )}
                      <span className="text-xs">
                        {isAuthenticated ? (isOwned ? '✅' : '⚠️') : '🃏'}
                      </span>
                      <span className="flex-1 text-xs text-gray-300 truncate">{card.cardName}</span>
                      <span className="text-xs text-gray-600">×{card.quantity}</span>
                      {cardUSD > 0 && (
                        <span className="text-xs text-green-600">
                          ${(cardUSD * card.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Leyenda badges */}
              {isAuthenticated && (
                <div className="flex gap-3 text-[10px] text-gray-600">
                  <span>✅ En tu colección</span>
                  <span>⚠️ Te falta</span>
                </div>
              )}
            </div>

            {/* ── Columna derecha: Trade + acción ─────────── */}
            <div className="p-5 space-y-5 flex flex-col">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {missing.length > 0
                  ? `Trade Finder · ${missingQty} carta${missingQty !== 1 ? 's' : ''} faltante${missingQty !== 1 ? 's' : ''}`
                  : 'Trade Finder'
                }
              </h3>

              {/* Contenido del trade */}
              <div className="flex-1">
                {missing.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm py-3">
                    <CheckCircle2 size={16} />
                    <span>¡Tienes todas las cartas del mazo!</span>
                  </div>

                ) : tradeLoading ? (
                  <div className="flex items-center gap-2 text-gray-600 text-sm py-3">
                    <Loader2 size={15} className="animate-spin" />
                    <span>Buscando jugadores cerca tuyo…</span>
                  </div>

                ) : tradeData?.length > 0 ? (
                  <TradeResults
                    tradeData={tradeData}
                    isAuthenticated={isAuthenticated}
                  />

                ) : (
                  <div className="space-y-2 py-2">
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <AlertCircle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
                      <span>
                        Nadie tiene estas cartas registradas aún — o el backend está iniciando.
                        {!isAuthenticated && ' Regístrate para aparecer en los resultados de otros jugadores.'}
                      </span>
                    </div>

                    {/* Cartas faltantes listadas */}
                    <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                      {missing.map((c) => (
                        <div key={c.scryfallId} className="flex items-center gap-2">
                          <span className="text-xs">⚠️</span>
                          <span className="text-xs text-gray-400 flex-1 truncate">{c.cardName}</span>
                          <span className="text-xs text-gray-600">×{c.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── CTA según estado de auth ──────────────── */}
              {!isAuthenticated ? (
                <CTAAnonymous onClose={onClose} />
              ) : savedOk ? (
                <div className="flex items-center gap-2 text-green-400 text-sm py-1">
                  <CheckCircle2 size={16} />
                  <span>¡Mazo guardado exitosamente!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {saveError && (
                    <p className="text-xs text-red-400">{saveError}</p>
                  )}
                  <button
                    onClick={handleSaveAndClose}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2
                      bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {saving
                      ? <><Loader2 size={15} className="animate-spin" /> Guardando…</>
                      : <><Save size={15} /> Guardar mazo</>
                    }
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────

function MiniStat({ icon, label, value, green, blue }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-lg p-2.5 text-center space-y-0.5">
      {icon && <div className="flex justify-center text-gray-600">{icon}</div>}
      <p className={`text-base font-bold ${green ? 'text-green-400' : blue ? 'text-blue-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-600">{label}</p>
    </div>
  )
}

function TradeResults({ tradeData, isAuthenticated }) {
  // tradeData: [{ oracleId, cardName, holders: [{ userId, username, contactInfo }] }]
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {tradeData.map((item) => (
        <div key={item.oracleId}>
          <p className="text-xs font-medium text-[var(--color-brand)] mb-1">{item.cardName}</p>

          {item.holders?.length > 0 ? (
            <div className="space-y-1">
              {item.holders.slice(0, 4).map((h) => (
                <div
                  key={h.userId}
                  className="flex items-center justify-between bg-[var(--color-surface)] rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs text-white font-medium">{h.username}</span>
                  {isAuthenticated ? (
                    <span className="text-xs text-blue-400 truncate max-w-[120px]">
                      {h.contactInfo ?? 'Sin contacto'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-600 italic">Regístrate para ver</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-700 pl-2 italic">Sin holders registrados</p>
          )}
        </div>
      ))}
    </div>
  )
}

function CTAAnonymous({ onClose }) {
  return (
    <div className="border border-[var(--color-brand)]/25 bg-[var(--color-brand)]/5 rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">¿Te gustó el mazo?</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Crea una cuenta gratis para guardarlo, ver los datos completos de contacto de cada trader y agregar tus cartas a la comunidad.
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          to="/register"
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1.5
            bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
            text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
        >
          <UserPlus size={13} /> Crear cuenta gratis
        </Link>
        <Link
          to="/login"
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-1.5
            border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-gray-500
            text-xs py-2.5 rounded-xl transition-colors"
        >
          <LogIn size={13} /> Ya tengo cuenta
        </Link>
      </div>
    </div>
  )
}