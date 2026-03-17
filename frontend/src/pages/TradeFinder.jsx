import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, Search, Loader2, AlertCircle,
  CheckCircle2, User, ChevronDown, ChevronUp
} from 'lucide-react'
import { useCollectionStore } from '../store/collectionStore'
import { useDebounce }        from '../hooks/useDebounce'
import { autocompleteCards, getCardByName } from '../services/scryfall'
import api from '../services/api'

export default function TradeFinder() {
  const entries = useCollectionStore((s) => s.entries)

  const [search,      setSearch]      = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [sugLoading,  setSugLoading]  = useState(false)
  const [showSug,     setShowSug]     = useState(false)

  const [wantList,    setWantList]    = useState([])  // [{ scryfallId, oracleId, cardName, imageUri }]
  const [results,     setResults]     = useState(null) // null | []
  const [searching,   setSearching]   = useState(false)
  const [error,       setError]       = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  // ── Autocomplete ──────────────────────────────────────────
  useEffect(() => {
  if (debouncedSearch.trim().length < 2) { setSuggestions([]); return }
  let cancelled = false
  setSugLoading(true)
  autocompleteCards(debouncedSearch)
    .then(({ data }) => { if (!cancelled) { setSuggestions(data.data?.slice(0, 8) ?? []); setShowSug(true) } })
    .catch(() => { if (!cancelled) setSuggestions([]) })
    .finally(() => { if (!cancelled) setSugLoading(false) })
  return () => { cancelled = true }
}, [debouncedSearch])

  const handleAddToWantList = async (name) => {
    setShowSug(false)
    setSearch('')
    if (wantList.some((c) => c.cardName === name)) return
    try {
      const { data: card } = await getCardByName(name)
      const imageUri =
        card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null
      setWantList((w) => [...w, {
        scryfallId: card.id,
        oracleId:   card.oracle_id,
        cardName:   card.name,
        imageUri,
      }])
    } catch { /* ignorar */ }
  }

  const removeFromWantList = (scryfallId) =>
    setWantList((w) => w.filter((c) => c.scryfallId !== scryfallId))

  // ── Buscar holders ────────────────────────────────────────
  const handleSearch = async () => {
    if (wantList.length === 0) return
    setSearching(true)
    setError(null)
    setResults(null)
    try {
      const oracleIds = wantList.map((c) => c.oracleId).filter(Boolean)
      const { data }  = await api.post('/trade/who-has', { oracleIds })
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al buscar trades')
    } finally {
      setSearching(false)
    }
  }

  const ownedIds = new Set(entries.map((e) => e.scryfallId))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Cabecera */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={20} className="text-[var(--color-brand)]" />
          <h1 className="text-xl font-bold text-white">Trade Finder</h1>
        </div>
        <p className="text-sm text-gray-600">
          Agrega las cartas que buscas y encontramos qué jugadores las tienen para tradear.
        </p>
      </div>

      {/* Buscador de want list */}
      <div className="relative">
        <div className={`flex items-center gap-2 bg-[var(--color-card)] border rounded-xl px-4 py-3 transition-colors
          ${showSug && suggestions.length > 0
            ? 'border-[var(--color-brand)] rounded-b-none'
            : 'border-[var(--color-border)]'
          }`}
        >
          {sugLoading
            ? <Loader2 size={15} className="text-gray-600 animate-spin shrink-0" />
            : <Search size={15} className="text-gray-600 shrink-0" />
          }
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSug(true) }}
            onFocus={() => suggestions.length > 0 && setShowSug(true)}
            placeholder="Agregar carta a tu lista de búsqueda…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-700 focus:outline-none"
          />
        </div>

        <AnimatePresence>
          {showSug && suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-30 w-full bg-[var(--color-card)] border border-[var(--color-brand)]
                border-t-0 rounded-b-xl shadow-2xl overflow-hidden"
            >
              {suggestions.map((name) => {
                const alreadyAdded = wantList.some((c) => c.cardName === name)
                return (
                  <li
                    key={name}
                    onClick={() => !alreadyAdded && handleAddToWantList(name)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                      ${alreadyAdded
                        ? 'text-gray-700 cursor-default'
                        : 'hover:bg-[var(--color-brand)]/20 cursor-pointer text-gray-300 hover:text-white'
                      }`}
                  >
                    <span>{name}</span>
                    {alreadyAdded
                      ? <CheckCircle2 size={13} className="text-green-700" />
                      : <span className="text-xs text-gray-600">+ agregar</span>
                    }
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Want list chips */}
      {wantList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
            Buscando {wantList.length} carta{wantList.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {wantList.map((card) => (
                <motion.div
                  key={card.scryfallId}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1    }}
                  exit={{   opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-2 bg-[var(--color-card)] border border-[var(--color-border)]
                    rounded-xl pl-1 pr-3 py-1 group/chip hover:border-red-500/40 transition-colors"
                >
                  {card.imageUri && (
                    <img
                      src={card.imageUri}
                      alt={card.cardName}
                      className="w-7 h-9 rounded-lg object-cover object-top"
                    />
                  )}
                  <span className="text-xs text-gray-300">{card.cardName}</span>
                  {ownedIds.has(card.scryfallId) && (
                    <span title="Ya la tienes" className="text-xs">✅</span>
                  )}
                  <button
                    onClick={() => removeFromWantList(card.scryfallId)}
                    className="text-gray-700 group-hover/chip:text-red-400 transition-colors ml-1 leading-none"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {searching
              ? <><Loader2 size={15} className="animate-spin" /> Buscando…</>
              : <><ArrowLeftRight size={15} /> Buscar traders</>
            }
          </button>
        </div>
      )}

      {/* Resultados */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
              text-red-400 text-sm rounded-xl px-4 py-3"
          >
            <AlertCircle size={15} />
            {error}
          </motion.div>
        )}

        {results !== null && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
              Resultados
            </h2>

            {results.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center space-y-3">
                <p className="text-4xl">🔍</p>
                <p className="text-sm text-gray-600">
                  Ningún jugador tiene estas cartas registradas aún.
                </p>
                <p className="text-xs text-gray-700">
                  Pídele a tu comunidad que registre su colección en MTG Trade Finder.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <TradeResultCard
                    key={item.oracleId}
                    item={item}
                    wantCard={wantList.find((c) => c.oracleId === item.oracleId)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado vacío inicial */}
      {wantList.length === 0 && results === null && (
        <div className="flex flex-col items-center py-20 text-center space-y-3">
          <p className="text-5xl">🤝</p>
          <h2 className="text-base font-semibold text-white">¿Qué cartas estás buscando?</h2>
          <p className="text-sm text-gray-600 max-w-sm">
            Usa el buscador de arriba para armar tu lista. Luego encontramos quién las tiene.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ── Sub-componente: resultado por carta ────────────────────────
function TradeResultCard({ item, wantCard }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      {/* Header de la carta */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors"
      >
        {wantCard?.imageUri && (
          <img
            src={wantCard.imageUri}
            alt={item.cardName}
            className="w-8 h-11 rounded-lg object-cover object-top shrink-0"
          />
        )}
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white">{item.cardName}</p>
          <p className="text-xs text-gray-600">
            {item.holders?.length ?? 0} jugador{(item.holders?.length ?? 0) !== 1 ? 'es' : ''} la tiene{(item.holders?.length ?? 0) !== 1 ? 'n' : ''}
          </p>
        </div>
        {item.holders?.length > 0
          ? <CheckCircle2 size={15} className="text-green-500 shrink-0" />
          : <AlertCircle  size={15} className="text-yellow-600 shrink-0" />
        }
        {expanded
          ? <ChevronUp   size={15} className="text-gray-600 shrink-0" />
          : <ChevronDown size={15} className="text-gray-600 shrink-0" />
        }
      </button>

      {/* Holders */}
      <AnimatePresence>
        {expanded && item.holders?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--color-border)]"
          >
            <div className="divide-y divide-[var(--color-border)]">
              {item.holders.map((h) => (
                <div
                  key={h.userId}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-brand)]/20
                      flex items-center justify-center text-[var(--color-brand)]">
                      <User size={13} />
                    </div>
                    <span className="text-sm text-white font-medium">{h.username}</span>
                  </div>

                  {h.contactInfo ? (
                    <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20
                      rounded-lg px-3 py-1 font-medium">
                      {h.contactInfo}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-700 italic">Sin contacto registrado</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}