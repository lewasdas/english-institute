import { useState, useMemo } from 'react'
import './VocabMatch.css'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function VocabMatch({ config, onComplete }) {
  const pairs = config?.pairs ?? []

  const words = useMemo(() => shuffle(pairs.map(p => p.word)), [])
  const translations = useMemo(() => shuffle(pairs.map(p => p.translation)), [])

  const [selectedWord, setSelectedWord] = useState(null)
  const [selectedTrans, setSelectedTrans] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(null)
  const [finished, setFinished] = useState(false)

  if (pairs.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin pares configurados.</p>
  }

  const tryMatch = (word, trans) => {
    const pair = pairs.find(p => p.word === word && p.translation === trans)
    if (pair) {
      const next = new Set(matched)
      next.add(word)
      setMatched(next)
      setSelectedWord(null)
      setSelectedTrans(null)
      if (next.size === pairs.length) {
        setFinished(true)
        const score = Math.max(0, Math.round(100 - mistakes * 10))
        setTimeout(() => onComplete(score), 1200)
      }
    } else {
      setMistakes(m => m + 1)
      setWrongFlash(`${word}|${trans}`)
      setTimeout(() => {
        setWrongFlash(null)
        setSelectedWord(null)
        setSelectedTrans(null)
      }, 500)
    }
  }

  const handleWord = (word) => {
    if (matched.has(word)) return
    const next = word === selectedWord ? null : word
    setSelectedWord(next)
    if (next && selectedTrans) tryMatch(next, selectedTrans)
  }

  const handleTrans = (trans) => {
    const word = pairs.find(p => p.translation === trans)?.word
    if (word && matched.has(word)) return
    const next = trans === selectedTrans ? null : trans
    setSelectedTrans(next)
    if (selectedWord && next) tryMatch(selectedWord, next)
  }

  const getWordClass = (word) => {
    if (matched.has(word)) return 'vm-chip matched'
    if (wrongFlash?.startsWith(`${word}|`)) return 'vm-chip wrong-flash'
    if (selectedWord === word) return 'vm-chip selected'
    return 'vm-chip'
  }

  const getTransClass = (trans) => {
    const word = pairs.find(p => p.translation === trans)?.word
    if (word && matched.has(word)) return 'vm-chip matched'
    if (wrongFlash?.endsWith(`|${trans}`)) return 'vm-chip wrong-flash'
    if (selectedTrans === trans) return 'vm-chip selected'
    return 'vm-chip'
  }

  return (
    <div className="vm-container">
      <div className="vm-header">
        <span>Emparejados: {matched.size} / {pairs.length}</span>
        {mistakes > 0 && <span className="vm-mistakes">Errores: {mistakes}</span>}
      </div>

      <p className="vm-info">Seleccioná una palabra y su traducción para emparejarlas</p>

      <div className="vm-columns">
        <div className="vm-column">
          <div className="vm-column-label">Inglés</div>
          {words.map(word => (
            <div key={word} className={getWordClass(word)} onClick={() => handleWord(word)}>
              {word}
            </div>
          ))}
        </div>
        <div className="vm-column">
          <div className="vm-column-label">Español</div>
          {translations.map(trans => (
            <div key={trans} className={getTransClass(trans)} onClick={() => handleTrans(trans)}>
              {trans}
            </div>
          ))}
        </div>
      </div>

      {finished && (
        <div className="vm-finish">
          <div className="vm-score-big">{Math.max(0, Math.round(100 - mistakes * 10))}%</div>
          <p>¡Todos los pares encontrados! 🎉</p>
        </div>
      )}
    </div>
  )
}
