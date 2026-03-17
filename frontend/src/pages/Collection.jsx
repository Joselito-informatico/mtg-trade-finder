import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Loader2, X, Library,
  Trash2, AlertCircle, CheckCircle2
} from 'lucide-react'
import { useCollectionStore } from '../store/collectionStore'
import { useDebounce }        from '../hooks/useDebounce'
import { autocompleteCards, getCardByName } from '../services/scryfall'

// ── Helpers ──────────────────────────────────────────────────
const getImage = (card) =>
  card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null

const getPrice = (card) =>
  card.prices?.usd ?? card.prices?.usd_foil ?? null

// ── Componente principal ──────────────────────────────────────
export default function Collection() {
  const { entries, isLoading, fetchCollection, addCard, updateCard, removeCard } =
    useCollectionStore()

  const [search,       setSearch]       = useState('')
  const [suggestions,  setSuggestions]  = useState([])
  const [sugLoading,   setSugLoading]   = useState(false)
  const [showSug,      setShowSug]      = useState(false)
  const [addingCard,   setAddingCard]   = useState(null)   // scryfallId en proceso
  const [toast,        setToast]        = useState(null)   // { msg, type }
  const [confirmDel,   setConfirmDel]   = useState(null)   // scryfallId a eliminar

  const debouncedSearch = useDebounce(search, 300)
  const searchRef       = useRef(null)
  const sugRef          = useRef(null)

  // ── Cargar colección al montar ────────────────────────────
  useEffect(() => { fetchCollection() }, [fetchCollection])

  // ── Autocomplete ──────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearch.trim().length < 2) { setSuggestions([]); return }

    let cancelled = false
    setSugLoading(true)

    autocompleteCards(debouncedSearch)
      .then(({ data }) => {
        if (cancelled) return
        setSuggestions(data.data?.slice(0, 8) ?? [])
        setShowSug(true)
      })
      .catch(() => { if (!cancelled) setSuggestions([]) })
      .finally(() => { if (!cancelled) setSugLoading(false) })

    return () => { cancelled = true }
  }, [debouncedSearch])

  // ── Cerrar suggestions al click fuera ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        !searchRef.current?.contains(e.target) &&
        !sugRef.current?.contains(e.target)
      ) setShowSug(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Agregar carta ─────────────────────────────────────────
  const handleSelect = async (name) => {
    setShowSug(false)
    setSearch('')
    setSuggestions([])

    try {
      const { data: card } = await getCardByName(name)

      // Ya la tiene en la colección → sumar 1
      const existing = entries.find((e) => e.scryfallId === card.id)
      if (existing) {
        setAddingCard(card.id)
        await updateCard(card.id, existing.quantity + 1)
        showToast(`+1 ${card.name} (×${existing.quantity + 1})`, 'success')
        return
      }

      setAddingCard(card.id)
      await addCard({
        scryfallId: card.id,
        oracleId:   card.oracle_id,
        cardName:   card.name,
        quantity:   1,
        foil:       false,
      })
      showToast(`${card.name} agregada a tu colección`, 'success')
    } catch {
      showToast('No se pudo agregar la carta', 'error')
    } finally {
      setAddingCard(null)
    }
  }

  // ── Eliminar carta ────────────────────────────────────────
  const handleRemove = async (scryfallId, cardName) => {
    setConfirmDel(null)
    try {
      await removeCard(scryfallId)
      showToast(`${cardName} eliminada`, 'info')
    } catch {
      showToast('Error al eliminar la carta', 'error')
    }
  }

  // ── Toast helper ──────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Stats rápidas ─────────────────────────────────────────
  const totalCards  = entries.reduce((a, e) => a + e.quantity, 0)
  const uniqueCards = entries.length
  const totalValue  = 0  // se calculará cuando el backend retorne precios

  // ── Render ────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
    >
      {/* ── Cabecera ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Library size={22} className="text-[var(--color-brand)]" />
          <div>
            <h1 className="text-xl font-bold text-white">Mi Colección</h1>
            <p className="text-xs text-gray-600">
              {uniqueCards} carta{uniqueCards !== 1 ? 's' : ''} únicas ·{' '}
              {totalCards} en total
            </p>
          </div>
        </div>

        {/* Buscador con autocomplete */}
        <div className="relative w-full sm:w-80">
          <div
            ref={searchRef}
            className={`flex items-center gap-2 bg-[var(--color-card)] border rounded-xl px-3 py-2.5 transition-colors
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
              placeholder="Agregar carta a la colección…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-700 focus:outline-none"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSuggestions([]); setShowSug(false) }}>
                <X size={13} className="text-gray-600 hover:text-white transition-colors" />
              </button>
            )}
          </div>

          {/* Dropdown suggestions */}
          <AnimatePresence>
            {showSug && suggestions.length > 0 && (
              <motion.ul
                ref={sugRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute z-30 w-full bg-[var(--color-card)] border border-[var(--color-brand)]
                  border-t-0 rounded-b-xl shadow-2xl overflow-hidden"
              >
                {suggestions.map((name) => {
                  const alreadyHas = entries.some((e) => e.cardName === name)
                  return (
                    <li
                      key={name}
                      onClick={() => handleSelect(name)}
                      className="flex items-center justify-between px-4 py-2.5 text-sm
                        hover:bg-[var(--color-brand)]/20 cursor-pointer transition-colors group"
                    >
                      <span className="text-gray-300 group-hover:text-white transition-colors truncate">
                        {name}
                      </span>
                      {alreadyHas
                        ? <span className="text-xs text-green-600 shrink-0 ml-2">+1</span>
                        : <Plus size={13} className="text-gray-700 group-hover:text-[var(--color-brand)] transition-colors shrink-0 ml-2" />
                      }
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Cuerpo ───────────────────────────────────────── */}
      {isLoading ? (
        <LoadingGrid />
      ) : entries.length === 0 ? (
        <EmptyState onSearchFocus={() => searchRef.current?.querySelector('input')?.focus()} />
      ) : (
        <CollectionGrid
          entries={entries}
          addingCard={addingCard}
          confirmDel={confirmDel}
          setConfirmDel={setConfirmDel}
          onRemove={handleRemove}
          onUpdateQty={updateCard}
        />
      )}

      {/* ── Toast ────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 24, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
              flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium
              ${toast.type === 'success' ? 'bg-green-500/90 text-white'
                : toast.type === 'error' ? 'bg-red-500/90 text-white'
                : 'bg-[var(--color-card)] border border-[var(--color-border)] text-gray-300'
              }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={15} />}
            {toast.type === 'error'   && <AlertCircle  size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────

function CollectionGrid({ entries, addingCard, confirmDel, setConfirmDel, onRemove, onUpdateQty }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <CollectionCard
            key={entry.scryfallId}
            entry={entry}
            isAdding={addingCard === entry.scryfallId}
            confirmDel={confirmDel}
            setConfirmDel={setConfirmDel}
            onRemove={onRemove}
            onUpdateQty={onUpdateQty}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function CollectionCard({ entry, isAdding, confirmDel, setConfirmDel, onRemove, onUpdateQty }) {
  const isConfirming = confirmDel === entry.scryfallId

  // La imagen la carga el frontend directo desde Scryfall por scryfallId
  const imageUrl = `https://cards.scryfall.io/normal/front/${entry.scryfallId[0]}/${entry.scryfallId[1]}/${entry.scryfallId}.jpg`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1   }}
      exit={{   opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      {/* Imagen */}
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={imageUrl}
          alt={entry.cardName}
          loading="lazy"
          className={`w-full rounded-xl shadow-md transition-all duration-200
            group-hover:shadow-xl group-hover:shadow-[var(--color-brand)]/20
            ${isAdding ? 'opacity-60 scale-95' : 'group-hover:scale-[1.03]'}
          `}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />

        {/* Spinner al agregar */}
        {isAdding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        )}

        {/* Overlay acciones al hover */}
        {!isConfirming && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-xl
            transition-all duration-200 flex flex-col items-center justify-end
            pb-3 gap-2 opacity-0 group-hover:opacity-100"
          >
            {/* Controles cantidad */}
            <div className="flex items-center gap-1 bg-black/70 rounded-lg px-2 py-1">
              <button
                onClick={() => onUpdateQty(entry.scryfallId, entry.quantity - 1)}
                className="w-6 h-6 flex items-center justify-center rounded
                  text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-base leading-none"
              >
                −
              </button>
              <span className="text-sm text-white font-bold w-6 text-center">{entry.quantity}</span>
              <button
                onClick={() => onUpdateQty(entry.scryfallId, entry.quantity + 1)}
                className="w-6 h-6 flex items-center justify-center rounded
                  text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-base leading-none"
              >
                +
              </button>
            </div>

            {/* Botón eliminar */}
            <button
              onClick={() => setConfirmDel(entry.scryfallId)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300
                bg-black/70 rounded-lg px-2.5 py-1 transition-colors"
            >
              <Trash2 size={11} /> Eliminar
            </button>
          </div>
        )}

        {/* Confirm eliminar */}
        <AnimatePresence>
          {isConfirming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 rounded-xl flex flex-col
                items-center justify-center gap-3 p-3"
            >
              <p className="text-xs text-white text-center leading-snug font-medium">
                ¿Eliminar {entry.cardName}?
              </p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => onRemove(entry.scryfallId, entry.cardName)}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white text-xs
                    font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmDel(null)}
                  className="flex-1 bg-[var(--color-border)] hover:bg-gray-600 text-gray-300
                    text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  No
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Badge cantidad (cuando no hay hover) */}
      {entry.quantity > 1 && (
        <span className="absolute top-2 right-2 bg-[var(--color-brand)] text-white
          text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center
          shadow group-hover:opacity-0 transition-opacity"
        >
          {entry.quantity}
        </span>
      )}

      {/* Nombre debajo */}
      <p className="mt-1.5 text-xs text-gray-500 truncate px-0.5 group-hover:text-gray-300 transition-colors">
        {entry.cardName}
      </p>
    </motion.div>
  )
}

function EmptyState({ onSearchFocus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      className="flex flex-col items-center justify-center py-24 text-center space-y-4"
    >
      <p className="text-6xl">📦</p>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Tu colección está vacía</h2>
        <p className="text-sm text-gray-600 max-w-xs">
          Busca una carta arriba para empezar a armar tu colección y aparecer en los resultados del Trade Finder
        </p>
      </div>
      <button
        onClick={onSearchFocus}
        className="mt-2 flex items-center gap-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
          text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        <Plus size={15} /> Agregar primera carta
      </button>
    </motion.div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-1.5 animate-pulse">
          <div className="w-full aspect-[5/7] bg-[var(--color-card)] rounded-xl" />
          <div className="h-2.5 bg-[var(--color-card)] rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}