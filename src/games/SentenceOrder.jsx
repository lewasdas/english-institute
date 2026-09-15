import { useState, useMemo } from 'react'
import './SentenceOrder.css'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function SentenceOrder({ config, onComplete }) {
  const sentences = useMemo(() => {
    const raw = config?.sentences ?? []
    return raw.map(s => ({
      original: s.trim(),
      shuffled: shuffle(s.trim().split(' '))
    }))
  }, [])

  const [current, setCurrent] = useState(0)
  const [pool, setPool] = useState(sentences[0]?.shuffled ?? [])
  const [zone, setZone] = useState([])
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [checked, setChecked] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  if (sentences.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin oraciones configuradas.</p>
  }

  const correct = sentences[current]?.original ?? ''

  const handleDragStart = (e, word, from, idx) => {
    setDragging({ word, from, idx })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropOnZone = (e) => {
    e.preventDefault()
    if (!dragging) return
    if (dragging.from === 'pool') {
      setPool(p => p.filter((_, i) => i !== dragging.idx))
      setZone(z => [...z, dragging.word])
    } else if (dragging.from === 'zone') {
      // reorder within zone — just move to end for simplicity
    }
    setDragOver(null)
    setDragging(null)
  }

  const handleDropOnPool = (e) => {
    e.preventDefault()
    if (!dragging || dragging.from !== 'zone') return
    setZone(z => z.filter((_, i) => i !== dragging.idx))
    setPool(p => [...p, dragging.word])
    setDragging(null)
  }

  const handleClickWord = (word, idx, from) => {
    if (checked) return
    if (from === 'pool') {
      setPool(p => p.filter((_, i) => i !== idx))
      setZone(z => [...z, word])
    } else {
      setZone(z => z.filter((_, i) => i !== idx))
      setPool(p => [...p, word])
    }
  }

  const handleCheck = () => {
    const answer = zone.join(' ')
    const isCorrect = answer === correct
    setChecked(true)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) setCorrectCount(c => c + 1)
    setTimeout(handleNext, 1800)
  }

  const handleNext = () => {
    const next = current + 1
    if (next >= sentences.length) {
      const finalCorrect = correctCount + (feedback === 'correct' ? 1 : 0)
      const score = Math.round((finalCorrect / sentences.length) * 100)
      onComplete(score)
    } else {
      setCurrent(next)
      setPool(sentences[next].shuffled)
      setZone([])
      setChecked(false)
      setFeedback(null)
    }
  }

  return (
    <div className="so-container">
      <div className="so-progress">
        <span>{current + 1} / {sentences.length}</span>
        <div className="so-progress-bar">
          <div className="so-progress-fill" style={{ width: `${(current / sentences.length) * 100}%` }} />
        </div>
        <span>{correctCount} ✓</span>
      </div>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Arrastrá o hacé click en las palabras para ordenar la oración.
      </p>

      <div className="so-label">Tu oración</div>
      <div
        className={`so-drop-zone ${dragOver === 'zone' ? 'drag-over' : ''} ${checked ? (feedback === 'correct' ? 'correct-zone' : 'wrong-zone') : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver('zone') }}
        onDragLeave={() => setDragOver(null)}
        onDrop={handleDropOnZone}
      >
        {zone.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Soltá las palabras aquí...</span>}
        {zone.map((word, i) => (
          <span
            key={`z-${i}`}
            className={`so-chip in-zone ${checked ? (feedback === 'correct' ? 'correct-chip' : 'wrong-chip') : ''}`}
            draggable={!checked}
            onDragStart={e => handleDragStart(e, word, 'zone', i)}
            onClick={() => handleClickWord(word, i, 'zone')}
          >
            {word}
          </span>
        ))}
      </div>

      <div className="so-label">Palabras disponibles</div>
      <div
        className="so-word-pool"
        onDragOver={e => { e.preventDefault(); setDragOver('pool') }}
        onDragLeave={() => setDragOver(null)}
        onDrop={handleDropOnPool}
      >
        {pool.map((word, i) => (
          <span
            key={`p-${i}`}
            className="so-chip"
            draggable={!checked}
            onDragStart={e => handleDragStart(e, word, 'pool', i)}
            onClick={() => handleClickWord(word, i, 'pool')}
          >
            {word}
          </span>
        ))}
      </div>

      {feedback && (
        <div className={`so-feedback ${feedback === 'correct' ? 'correct-fb' : 'wrong-fb'}`}>
          {feedback === 'correct' ? '¡Correcto! 🎉' : `Incorrecto. Orden: "${correct}"`}
        </div>
      )}

      <div className="so-actions">
        <button
          className="so-btn so-btn-primary"
          onClick={handleCheck}
          disabled={checked || zone.length === 0}
        >
          Verificar
        </button>
        {checked && (
          <button className="so-btn so-btn-secondary" onClick={handleNext}>
            {current + 1 < sentences.length ? 'Siguiente →' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  )
}
