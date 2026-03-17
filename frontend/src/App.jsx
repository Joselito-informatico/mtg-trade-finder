import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Collection from './pages/Collection'
import DeckBuilder from './pages/DeckBuilder'
import TradeFinder from './pages/TradeFinder'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-surface)] text-white">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/deck-builder" element={<DeckBuilder />} />  {/* ← público */}

            {/* Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/collection" element={<Collection />} />
              <Route path="/trade-finder" element={<TradeFinder />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  )
}