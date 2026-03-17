import { Trash2, Plus, Minus, Wand2, BookOpen } from 'lucide-react'
import { useDeckStore } from '../../store/deckStore'
import { useAuthStore } from '../../store/authStore'

// Orden de tipos para agrupar
const TYPE_ORDER = [
  'Creature', 'Planeswalker', 'Battle',
  'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other',
]

const TYPE_LABELS = {
  Creature: 'Criaturas', Planeswalker: 'Planeswalkers', Battle: 'Batallas',
  Instant: 'Instantáneos', Sorcery: 'Conjuros', Enchantment: 'Encantamientos',
  Artifact: 'Artefactos', Land: 'Tierras', Other: 'Otros',
}

const resolveType = (typeLine = '') => {
  for (const t of TYPE_ORDER.slice(0, -1)) {
    if (typeLine.includes(t)) return t
  }
  return 'Other'
}

export default function DeckSidePanel({ onFinish }) {
  const { cards, deckName, format, setDeckName, setFormat, updateQuantity, removeCard, clearDeck, totalCards } = useDeckStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const total = totalCards()

  // Agrupar por tipo
  const grouped = cards.reduce((acc, card) => {
    const t = resolveType(card.typeLine)
    if (!acc[t]) acc[t] = []
    acc[t].push(card)
    return acc
  }, {})

  const estimatedUSD = cards.reduce((acc, c) => {
    const p = parseFloat(c.prices?.usd ?? c.prices?.usd_foil ?? 0)
    return acc + p * c.quantity
  }, 0)

  return (
    <div className="flex flex-col h-full">

      {/* Cabecera del mazo */}
      <div className="p-4 border-b border-[var(--color-border)] space-y-3">
        <div className="flex items-start gap-2">
          <Wand2 size={15} className="text-[var(--color-brand)] mt-0.5 shrink-0" />
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Nombre del mazo"
            className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-[var(--color-brand)] transition-colors pb-0.5 min-w-0"
          />
        </div>

        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
        >
          <option value="">Sin formato</option>
          <option value="standard">Standard</option>
          <option value="pioneer">Pioneer</option>
          <option value="modern">Modern</option>
          <option value="legacy">Legacy</option>
          <option value="vintage">Vintage</option>
          <option value="commander">Commander</option>
          <option value="pauper">Pauper</option>
        </select>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <BookOpen size={12} />
            <span>{total} carta{total !== 1 ? 's' : ''}</span>
            {estimatedUSD > 0 && (
              <span className="text-green-500">${estimatedUSD.toFixed(2)}</span>
            )}
          </div>
          {cards.length > 0 && (
            <button
              onClick={clearDeck}
              className="flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista de cartas agrupadas por tipo */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {cards.length === 0 ? (
          <div className="text-center py-10 text-gray-700 space-y-2">
            <p className="text-3xl">🃏</p>
            <p className="text-xs leading-relaxed">
              Haz clic en cualquier carta<br />del buscador para agregarla
            </p>
          </div>
        ) : (
          TYPE_ORDER.filter((t) => grouped[t]?.length > 0).map((type) => {
            const group = grouped[type]
            const groupTotal = group.reduce((a, c) => a + c.quantity, 0)

            return (
              <div key={type}>
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
                  {TYPE_LABELS[type]} <span className="text-gray-700">({groupTotal})</span>
                </p>
                <div className="space-y-1">
                  {group.map((card) => (
                    <DeckCardRow
                      key={card.scryfallId}
                      card={card}
                      onIncrease={() => updateQuantity(card.scryfallId, card.quantity + 1)}
                      onDecrease={() => updateQuantity(card.scryfallId, card.quantity - 1)}
                      onRemove={() => removeCard(card.scryfallId)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Botón finalizar */}
      <div className="p-4 border-t border-[var(--color-border)]">
        {!isAuthenticated && cards.length > 0 && (
          <p className="text-[10px] text-gray-600 text-center mb-2">
            Regístrate para guardar tu mazo
          </p>
        )}
        <button
          onClick={onFinish}
          disabled={cards.length === 0}
          className="w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]
            disabled:opacity-30 disabled:cursor-not-allowed
            text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {isAuthenticated ? '💾 Guardar mazo' : '🔍 Ver resumen del mazo'}
        </button>
      </div>
    </div>
  )
}

function DeckCardRow({ card, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="flex items-center gap-2 group/row py-0.5">
      {/* Mini imagen */}
      {card.imageUri ? (
        <img
          src={card.imageUri}
          alt={card.cardName}
          className="w-7 h-9 rounded object-cover object-top shrink-0"
        />
      ) : (
        <div className="w-7 h-9 bg-[var(--color-border)] rounded shrink-0" />
      )}

      {/* Nombre */}
      <span className="flex-1 text-xs text-gray-300 truncate min-w-0">{card.cardName}</span>

      {/* Controles: visibles al hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button
          onClick={onDecrease}
          className="w-5 h-5 flex items-center justify-center rounded bg-[var(--color-border)] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
        >
          <Minus size={9} />
        </button>
        <span className="text-xs text-white font-medium w-5 text-center">{card.quantity}</span>
        <button
          onClick={onIncrease}
          className="w-5 h-5 flex items-center justify-center rounded bg-[var(--color-border)] hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors"
        >
          <Plus size={9} />
        </button>
      </div>
    </div>
  )
}