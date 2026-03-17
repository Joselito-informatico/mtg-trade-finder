import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { searchCards } from '../../services/scryfall'
import { useDeckStore } from '../../store/deckStore'
import { useCollectionStore } from '../../store/collectionStore'
import { useAuthStore } from '../../store/authStore'

// ── Constantes ──────────────────────────────────────────────
const MTG_COLORS = [
  { id: 'W', label: 'W', title: 'Blanco',    bg: '#f9f3d9', fg: '#78570a' },
  { id: 'U', label: 'U', title: 'Azul',      bg: '#3b82f6', fg: '#fff'    },
  { id: 'B', label: 'B', title: 'Negro',      bg: '#1f2937', fg: '#d1d5db' },
  { id: 'R', label: 'R', title: 'Rojo',       bg: '#ef4444', fg: '#fff'    },
  { id: 'G', label: 'G', title: 'Verde',      bg: '#16a34a', fg: '#fff'    },
  { id: 'C', label: '◇', title: 'Incoloro',  bg: '#6b7280', fg: '#fff'    },
]

const CARD_TYPES = [
  { value: '',             label: 'Todos los tipos'  },
  { value: 'creature',     label: 'Criatura'         },
  { value: 'instant',      label: 'Instantáneo'      },
  { value: 'sorcery',      label: 'Conjuro'          },
  { value: 'enchantment',  label: 'Encantamiento'    },
  { value: 'artifact',     label: 'Artefacto'        },
  { value: 'planeswalker', label: 'Planeswalker'      },
  { value: 'land',         label: 'Tierra'           },
  { value: 'battle',       label: 'Batalla'          },
]

const FORMATS = [
  { value: '',          label: 'Todos los formatos' },
  { value: 'standard',  label: 'Standard'           },
  { value: 'pioneer',   label: 'Pioneer'            },
  { value: 'modern',    label: 'Modern'             },
  { value: 'legacy',    label: 'Legacy'             },
  { value: 'vintage',   label: 'Vintage'            },
  { value: 'commander', label: 'Commander'          },
  { value: 'pauper',    label: 'Pauper'             },
]

const CMC_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7+']

// ── Helpers ──────────────────────────────────────────────────
const buildQuery = (search, filters) => {
  const parts = []

  if (search.trim()) parts.push(search.trim())

  if (filters.colors.length > 0) {
    const colorParts = filters.colors.map((c) => (c === 'C' ? 'c:C' : `c:${c}`))
    parts.push(colorParts.length === 1 ? colorParts[0] : `(${colorParts.join(' OR ')})`)
  }

  if (filters.type)   parts.push(`t:${filters.type}`)
  if (filters.format) parts.push(`f:${filters.format}`)
  if (filters.cmc !== '') {
    parts.push(filters.cmc === '7+' ? 'cmc>=7' : `cmc=${filters.cmc}`)
  }

  return parts.join(' ') || 'a'
}

const getImage = (card) =>
  card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null

const getPrice = (card) =>
  card.prices?.usd ?? card.prices?.usd_foil ?? null

// ── Componente ────────────────────────────────────────────────
export default function CardSearchPanel() {
  const [search, setSearch]         = useState('')
  const [myCollection, setMyCollection] = useState(false)
  const [filters, setFilters]       = useState({ colors: [], type: '', format: '', cmc: '' })
  const [results, setResults]       = useState([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  const addCard         = useDeckStore((s) => s.addCard)
  const deckCards       = useDeckStore((s) => s.cards)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const collection      = useCollectionStore((s) => s.entries)

  const hasActiveFilters =
    filters.colors.length > 0 || filters.type || filters.format || filters.cmc !== ''
  const shouldSearch = debouncedSearch.trim().length > 0 || hasActiveFilters

  // ── Búsqueda en Scryfall ──────────────────────────────────
  useEffect(() => {
    if (!shouldSearch) { setResults([]); return }

    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const query = buildQuery(debouncedSearch, filters)
        const { data } = await searchCards(query)
        if (cancelled) return

        let cards = data.data ?? []

        if (myCollection && isAuthenticated) {
          const owned = new Set(collection.map((e) => e.scryfallId))
          cards = cards.filter((c) => owned.has(c.id))
        }

        setResults(cards.slice(0, 40))
      } catch (err) {
        if (cancelled) return
        setError(
          err.response?.status === 404
            ? 'Sin resultados — prueba con otro término o ajusta los filtros'
            : 'Error al conectar con Scryfall'
        )
        setResults([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, myCollection, isAuthenticated])

  // ── Handlers ─────────────────────────────────────────────
  const toggleColor = (id) =>
    setFilters((f) => ({
      ...f,
      colors: f.colors.includes(id) ? f.colors.filter((c) => c !== id) : [...f.colors, id],
    }))

  const resetFilters = () => setFilters({ colors: [], type: '', format: '', cmc: '' })

  const handleAdd = useCallback((card) => {
    addCard({
      scryfallId: card.id,
      oracleId:   card.oracle_id,
      cardName:   card.name,
      imageUri:   getImage(card),
      prices:     card.prices ?? {},
      colors:     card.colors ?? [],
      typeLine:   card.type_line ?? '',
      cmc:        card.cmc ?? 0,
      manaCost:   card.mana_cost ?? '',
      legalities: card.legalities ?? {},
    })
  }, [addCard])

  const qtyInDeck = (id) => deckCards.find((c) => c.scryfallId === id)?.quantity ?? 0
  const isOwned   = (id) => collection.some((e) => e.scryfallId === id)

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">

      {/* Barra superior */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar carta en Scryfall…"
            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {isAuthenticated && (
          <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden text-xs font-medium shrink-0">
            <button
              onClick={() => setMyCollection(false)}
              className={`px-3 py-2 transition-colors ${!myCollection ? 'bg-[var(--color-brand)] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Explorar
            </button>
            <button
              onClick={() => setMyCollection(true)}
              className={`px-3 py-2 transition-colors ${myCollection ? 'bg-[var(--color-brand)] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Mi colección
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Colores WUBRG */}
        <div className="flex items-center gap-1">
          {MTG_COLORS.map((c) => {
            const active = filters.colors.includes(c.id)
            return (
              <button
                key={c.id}
                title={c.title}
                onClick={() => toggleColor(c.id)}
                style={{
                  backgroundColor: c.bg,
                  color: c.fg,
                  borderColor: active ? 'var(--color-brand)' : 'transparent',
                }}
                className={`w-7 h-7 rounded-full border-2 text-xs font-bold transition-all
                  ${active ? 'scale-110 ring-2 ring-[var(--color-brand)]/50 ring-offset-1 ring-offset-[var(--color-surface)]' : 'opacity-40 hover:opacity-75'}`}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Tipo */}
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
        >
          {CARD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* CMC */}
        <div className="flex items-center gap-0.5">
          <span className="text-xs text-gray-600 mr-1">CMC</span>
          {CMC_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => setFilters((f) => ({ ...f, cmc: f.cmc === v ? '' : v }))}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors
                ${filters.cmc === v
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] text-gray-500 hover:border-[var(--color-brand)] hover:text-gray-300'
                }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Formato */}
        <select
          value={filters.format}
          onChange={(e) => setFilters((f) => ({ ...f, format: e.target.value }))}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Estados: cargando / error / vacío / resultados */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-600 gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Buscando en Scryfall…</span>
        </div>

      ) : error ? (
        <div className="text-center py-20 text-gray-600 text-sm">{error}</div>

      ) : !shouldSearch ? (
        <div className="text-center py-20 text-gray-700 space-y-2">
          <p className="text-4xl">🔍</p>
          <p className="text-sm">Escribe el nombre de una carta o usa los filtros de arriba</p>
          <p className="text-xs text-gray-600">No necesitas cuenta — construye tu mazo gratis</p>
        </div>

      ) : results.length === 0 ? (
        <div className="text-center py-20 text-gray-600 text-sm">
          Sin resultados para esa búsqueda
        </div>

      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {results.map((card) => {
            const img   = getImage(card)
            const price = getPrice(card)
            const qty   = qtyInDeck(card.id)
            const owned = isAuthenticated && isOwned(card.id)

            return (
              <CardResult
                key={card.id}
                card={card}
                img={img}
                price={price}
                qty={qty}
                owned={owned}
                isAuthenticated={isAuthenticated}
                onAdd={handleAdd}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sub-componente separado para evitar re-renders innecesarios ──
function CardResult({ card, img, price, qty, owned, isAuthenticated, onAdd }) {
  return (
    <div className="relative group cursor-pointer select-none" onClick={() => onAdd(card)}>
      {/* Imagen o fallback */}
      {img ? (
        <img
          src={img}
          alt={card.name}
          loading="lazy"
          className="w-full rounded-xl shadow-md transition-all duration-200
            group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[var(--color-brand)]/20"
        />
      ) : (
        <div className="w-full aspect-[5/7] bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex items-center justify-center text-xs text-gray-500 text-center p-2 group-hover:border-[var(--color-brand)] transition-colors">
          {card.name}
        </div>
      )}

      {/* Badge ✅ / ⚠️ */}
      {isAuthenticated && (
        <span className="absolute top-1.5 left-1.5 text-base drop-shadow leading-none">
          {owned ? '✅' : '⚠️'}
        </span>
      )}

      {/* Cantidad en mazo */}
      {qty > 0 && (
        <span className="absolute top-1.5 right-1.5 bg-[var(--color-brand)] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
          {qty}
        </span>
      )}

      {/* Precio */}
      {price && (
        <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-green-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-sm">
          ${price}
        </span>
      )}

      {/* Overlay "+"  al hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
        <span className="bg-[var(--color-brand)] text-white w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold shadow-lg translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
          +
        </span>
      </div>
    </div>
  )
}