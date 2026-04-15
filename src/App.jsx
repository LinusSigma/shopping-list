import { useState, useEffect, useRef } from 'react'
import './App.css'

const STORAGE_ITEMS = 'sl_items'
const STORAGE_HISTORY = 'sl_history'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

function CartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
      <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function App() {
  const [items, setItems] = useState(() => load(STORAGE_ITEMS, []))
  const [history, setHistory] = useState(() => load(STORAGE_HISTORY, []))
  const [inputValue, setInputValue] = useState('')
  const [removingIds, setRemovingIds] = useState(new Set())
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef(null)

  const suggestions = (() => {
    if (!inputValue.trim()) return []
    const activeNames = new Set(items.map(i => i.name.toLowerCase()))
    const query = inputValue.toLowerCase()
    return history
      .filter(h => !activeNames.has(h.toLowerCase()) && h.toLowerCase().includes(query))
      .slice(0, 6)
  })()

  useEffect(() => {
    localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history))
  }, [history])

  const inactiveItems = (() => {
    const activeNames = new Set(items.map(i => i.name.toLowerCase()))
    return history
      .filter(h => !activeNames.has(h.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'sv', { sensitivity: 'base' }))
  })()

  const addItem = (name, fromInput = false) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('')
      return
    }
    setItems(prev => [...prev, { id: Date.now() + Math.random(), name: trimmed }])
    setHistory(prev => [trimmed, ...prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase())])
    setInputValue('')
    if (fromInput) inputRef.current?.blur()
  }

  const buyItem = (id) => {
    setRemovingIds(prev => new Set([...prev, id]))
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
      setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }, 380)
  }

  const deleteFromHistory = (name) => {
    setHistory(prev => prev.filter(h => h.toLowerCase() !== name.toLowerCase()))
  }

  return (
    <div className="app">
      <header className="app-header">
        <CartIcon />
        <span className="app-header-title">Handlingslista</span>
      </header>
      <main className="main">
        <div className="input-area">
        <form className="input-wrapper" onSubmit={e => { e.preventDefault(); addItem(inputValue, true) }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Add item..."
            className="add-input"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="done"
          />
          <button
            className="add-btn"
            type="submit"
            disabled={!inputValue.trim()}
            aria-label="Add item"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </form>
        {inputFocused && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                className="suggestion-item"
                onMouseDown={e => e.preventDefault()}
                onClick={() => addItem(s, true)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <p className="empty-title">Your list is empty</p>
            <p className="empty-hint">Add items above to get started</p>
          </div>
        ) : (
          <ul className="items-list">
            {items.map(item => (
              <li
                key={item.id}
                className={`item${removingIds.has(item.id) ? ' item--bought' : ''}`}
                onClick={() => buyItem(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') buyItem(item.id) }}
              >
                <span className="item-circle">
                  <span className="item-check-icon"><CheckIcon /></span>
                </span>
                <span className="item-name">{item.name}</span>
                <span className="item-tap-hint">tap to buy</span>
              </li>
            ))}
          </ul>
        )}

        {inactiveItems.length > 0 && (
          <div className="inactive-section">
            <div className="inactive-label">Previously bought</div>
            <ul className="inactive-list">
              {inactiveItems.map((name, i) => (
                <li key={i} className="inactive-item" onClick={() => addItem(name)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') addItem(name) }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" className="inactive-plus">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>{name}</span>
                  <button
                    className="inactive-delete"
                    onClick={e => { e.stopPropagation(); deleteFromHistory(name) }}
                    aria-label={`Remove ${name} from history`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
