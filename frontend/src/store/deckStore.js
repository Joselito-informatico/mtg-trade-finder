import { create } from 'zustand'

// El mazo vive en memoria — sin persist intencional para usuarios anónimos
export const useDeckStore = create((set, get) => ({
  cards: [],        // [{ scryfallId, oracleId, cardName, quantity, imageUri, prices, colors, typeLine, cmc, manaCost, legalities }]
  deckName: 'Mi nuevo mazo',
  format: 'standard',

  setDeckName: (name) => set({ deckName: name }),
  setFormat: (format) => set({ format }),

  addCard: (card) => {
    const existing = get().cards.find((c) => c.scryfallId === card.scryfallId)
    if (existing) {
      set((s) => ({
        cards: s.cards.map((c) =>
          c.scryfallId === card.scryfallId ? { ...c, quantity: c.quantity + 1 } : c
        ),
      }))
    } else {
      set((s) => ({ cards: [...s.cards, { ...card, quantity: 1 }] }))
    }
  },

  removeCard: (scryfallId) =>
    set((s) => ({ cards: s.cards.filter((c) => c.scryfallId !== scryfallId) })),

  updateQuantity: (scryfallId, quantity) => {
    if (quantity <= 0) {
      get().removeCard(scryfallId)
      return
    }
    set((s) => ({
      cards: s.cards.map((c) =>
        c.scryfallId === scryfallId ? { ...c, quantity } : c
      ),
    }))
  },

  clearDeck: () => set({ cards: [], deckName: 'Mi nuevo mazo' }),

  totalCards: () => get().cards.reduce((acc, c) => acc + c.quantity, 0),
}))