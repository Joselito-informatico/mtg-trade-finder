import { create } from 'zustand'
import api from '../services/api'

export const useCollectionStore = create((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchCollection: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/collection')
      set({ entries: data, isLoading: false })
    } catch (err) {
      set({ error: err.response?.data?.message ?? 'Error al cargar colección', isLoading: false })
    }
  },

  addCard: async (card) => {
    // card: { scryfallId, oracleId, cardName, quantity, foil }
    const { data } = await api.post('/collection', card)
    set((s) => ({ entries: [...s.entries, data] }))
  },

  updateCard: async (scryfallId, quantity) => {
    const { data } = await api.put(`/collection/${scryfallId}`, { quantity })
    set((s) => ({
      entries: s.entries.map((e) => (e.scryfallId === scryfallId ? data : e)),
    }))
  },

  removeCard: async (scryfallId) => {
    await api.delete(`/collection/${scryfallId}`)
    set((s) => ({ entries: s.entries.filter((e) => e.scryfallId !== scryfallId) }))
  },

  hasCard: (scryfallId) => get().entries.some((e) => e.scryfallId === scryfallId),

  getQuantity: (scryfallId) => get().entries.find((e) => e.scryfallId === scryfallId)?.quantity ?? 0,
}))