import { useState, useEffect, useCallback } from 'react'
import './MultipleChoice.css'

const LETTERS = ['A', 'B', 'C', 'D']

export default function MultipleChoice({ config, onComplete }) {
  const questions = config?.questions ?? []
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [finished, setFinished] = useState(false)

  const advance = useCallback(() => {
    const next = current + 1
    if (next >= questions.length) {
      setFinished(true)
      const score = Math.round(((correctCount) / questions.length) * 100)
      onComplete(score)
    } else {
      setCurrent(next)
      setSelected(null)
      setFeedback(null)
    }
  }, [current, questions.length, correctCount, onComplete])

  const handleSelect = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = idx === questions[current].correct
    if (isCorrect) {
      setCorrectCount(c => c + 1)
      setFeedback('correct')
    } else {
      setFeedback('wrong')
    }
    setTimeout(advance, 1500)
  }

  if (questions.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin preguntas configuradas.</p>
  }

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="mc-finish">
        <h3>¡Juego terminado!</h3>
        <div className="mc-score-big">{score}%</div>
        <p>{correctCount} de {questions.length} correctas</p>
      </div>
    )
  }

  const q = questions[current]
  const progress = (current / questions.length) * 100

  return (
    <div className="mc-container">
      <div className="mc-progress">
        <span>{current + 1} / {questions.length}</span>
        <div className="mc-progress-bar">
          <div className="mc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{correctCount} ✓</span>
      </div>

      <div className="mc-question-card">
        <p className="mc-question-text">{q.question}</p>
        <div className="mc-options">
          {q.options.map((opt, idx) => {
            let cls = 'mc-option'
            if (selected !== null) {
              if (idx === q.correct) cls += ' correct'
              else if (idx === selected) cls += ' wrong'
            }
            return (
              <button
                key={idx}
                className={cls}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
              >
                <span className="mc-option-letter">{LETTERS[idx]}</span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {feedback && (
        <div className={`mc-feedback ${feedback === 'correct' ? 'correct-fb' : 'wrong-fb'}`}>
          {feedback === 'correct' ? '¡Correcto! 🎉' : `Incorrecto. La respuesta era: ${q.options[q.correct]}`}
        </div>
      )}
    </div>
  )
}
