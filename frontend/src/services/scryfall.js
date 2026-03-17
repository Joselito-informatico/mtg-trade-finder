import axios from 'axios'

const scryfall = axios.create({
  baseURL: 'https://api.scryfall.com',
  timeout: 8_000,
})

export const autocompleteCards = (query) =>
  scryfall.get('/cards/autocomplete', { params: { q: query, include_extras: false } })

export const searchCards = (query, page = 1) =>
  scryfall.get('/cards/search', { params: { q: query, page, order: 'name' } })

export const getCardByName = (exact) =>
  scryfall.get('/cards/named', { params: { exact } })

export const getCardById = (id) =>
  scryfall.get(`/cards/${id}`)

export default scryfall