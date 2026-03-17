import { useState } from 'react'
import { motion } from 'framer-motion'
import CardSearchPanel from '../components/deck/CardSearchPanel'
import DeckSidePanel from '../components/deck/DeckSidePanel'
import DeckSummaryModal from '../components/deck/DeckSummaryModal'
import { useDeckStore } from '../store/deckStore'

export default function DeckBuilder() {
  const [showSummary, setShowSummary] = useState(false)
  const cards = useDeckStore((s) => s.cards)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-[calc(100vh-57px)] overflow-hidden bg-[var(--color-surface)]"
    >
      {/* Panel izquierdo: búsqueda + filtros + resultados */}
      <div className="flex-1 overflow-y-auto border-r border-[var(--color-border)]">
        <CardSearchPanel />
      </div>

      {/* Panel derecho: mazo actual */}
      <div className="w-72 shrink-0 overflow-y-auto bg-[var(--color-card)]">
        <DeckSidePanel onFinish={() => setShowSummary(true)} />
      </div>

      {showSummary && (
        <DeckSummaryModal onClose={() => setShowSummary(false)} />
      )}
    </motion.div>
  )
}