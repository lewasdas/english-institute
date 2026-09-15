import { useState } from 'react'
import './Translation.css'

export default function Translation({ config, onComplete }) {
  const pairs = config?.pairs ?? []
  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  if (pairs.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin pares configurados.</p>
  }

  const pair = pairs[current]

  const handleCheck = () => {
    if (!input.trim()) return
    const isCorrect = input.trim().toLowerCase() === pair.english.trim().toLowerCase()
    setChecked(true)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) setCorrectCount(c => c + 1)
    setTimeout(handleNext, 1800)
  }

  const handleNext = () => {
    const next = current + 1
    if (next >= pairs.length) {
      const finalCorrect = correctCount + (feedback === 'correct' ? 1 : 0)
      const score = Math.round((finalCorrect / pairs.length) * 100)
      onComplete(score)
    } else {
      setCurrent(next)
      setInput('')
      setChecked(false)
      setFeedback(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !checked) handleCheck()
  }

  const inputClass = checked
    ? (feedback === 'correct' ? 'tr-input correct' : 'tr-input wrong')
    : 'tr-input'

  return (
    <div className="tr-container">
      <div className="tr-progress">
        <span>{current + 1} / {pairs.length}</span>
        <div className="tr-progress-bar">
          <div className="tr-progress-fill" style={{ width: `${(current / pairs.length) * 100}%` }} />
        </div>
        <span>{correctCount} ✓</span>
      </div>

      <div className="tr-card">
        <div>
          <p className="tr-prompt-label">Traducí al inglés</p>
          <p className="tr-word">{pair.spanish}</p>
        </div>

        <div className="tr-input-wrap">
          <input
            type="text"
            className={inputClass}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={checked}
            placeholder="Escribe la traducción..."
            autoFocus
          />
        </div>

        {feedback && (
          <div className={`tr-feedback ${feedback === 'correct' ? 'correct-fb' : 'wrong-fb'}`}>
            {feedback === 'correct'
              ? `¡Correcto! "${pair.english}" 🎉`
              : `Incorrecto. La respuesta era: "${pair.english}"`}
          </div>
        )}

        <div className="tr-actions">
          <button
            className="tr-btn tr-btn-primary"
            onClick={handleCheck}
            disabled={checked || !input.trim()}
          >
            Verificar
          </button>
          {checked && (
            <button className="tr-btn tr-btn-secondary" onClick={handleNext}>
              {current + 1 < pairs.length ? 'Siguiente →' : 'Finalizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
