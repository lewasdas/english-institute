import { useState } from 'react'
import './FillBlanks.css'

function parseSentence(raw) {
  // Returns { parts: [{text, isBlank, answer}] }
  const parts = []
  const regex = /\[([^\]]+)\]/g
  let last = 0
  let match
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last) parts.push({ text: raw.slice(last, match.index), isBlank: false })
    parts.push({ text: '', isBlank: true, answer: match[1] })
    last = match.index + match[0].length
  }
  if (last < raw.length) parts.push({ text: raw.slice(last), isBlank: false })
  return parts
}

export default function FillBlanks({ config, onComplete }) {
  const sentences = config?.sentences ?? []
  const [current, setCurrent] = useState(0)
  const [inputs, setInputs] = useState({})
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState(null)

  if (sentences.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin oraciones configuradas.</p>
  }

  const parts = parseSentence(sentences[current])
  const blanks = parts.filter(p => p.isBlank)

  const handleInput = (idx, val) => {
    setInputs(prev => ({ ...prev, [idx]: val }))
  }

  const handleCheck = () => {
    const allCorrect = blanks.every((b, i) =>
      (inputs[i] ?? '').trim().toLowerCase() === b.answer.toLowerCase()
    )
    setChecked(true)
    setFeedback(allCorrect ? 'correct' : 'wrong')
    if (allCorrect) setCorrectCount(c => c + 1)
    setTimeout(handleNext, 1800)
  }

  const handleNext = () => {
    const next = current + 1
    if (next >= sentences.length) {
      const score = Math.round(((correctCount + (feedback === 'correct' ? 1 : 0)) / sentences.length) * 100)
      onComplete(score)
    } else {
      setCurrent(next)
      setInputs({})
      setChecked(false)
      setFeedback(null)
    }
  }

  let blankIdx = -1

  return (
    <div className="fb-container">
      <div className="fb-progress">
        <span>{current + 1} / {sentences.length}</span>
        <div className="fb-progress-bar">
          <div className="fb-progress-fill" style={{ width: `${(current / sentences.length) * 100}%` }} />
        </div>
        <span>{correctCount} ✓</span>
      </div>

      <div className="fb-card">
        <div className="fb-sentence">
          {parts.map((part, i) => {
            if (!part.isBlank) {
              return part.text.split(' ').map((word, wi) => (
                <span key={`${i}-${wi}`} className="fb-word">{word}</span>
              ))
            }
            blankIdx++
            const bi = blankIdx
            const val = inputs[bi] ?? ''
            let cls = ''
            if (checked) cls = val.trim().toLowerCase() === part.answer.toLowerCase() ? 'correct' : 'wrong'
            return (
              <span key={i} className="fb-blank">
                <input
                  type="text"
                  value={val}
                  onChange={e => handleInput(bi, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !checked) handleCheck() }}
                  disabled={checked}
                  className={cls}
                  style={{ width: `${Math.max(80, part.answer.length * 16)}px` }}
                  autoFocus={bi === 0}
                />
              </span>
            )
          })}
        </div>

        {feedback && (
          <div className={`fb-feedback ${feedback === 'correct' ? 'correct-fb' : 'wrong-fb'}`}>
            {feedback === 'correct'
              ? '¡Correcto! 🎉'
              : `Incorrecto. ${blanks.map(b => b.answer).join(', ')}`}
          </div>
        )}

        <div className="fb-actions">
          <button
            className="fb-btn fb-btn-primary"
            onClick={handleCheck}
            disabled={checked || blanks.some((_, i) => !inputs[i]?.trim())}
          >
            Verificar
          </button>
          {checked && (
            <button className="fb-btn fb-btn-secondary" onClick={handleNext}>
              {current + 1 < sentences.length ? 'Siguiente →' : 'Finalizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
