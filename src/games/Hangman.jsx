import { useState, useEffect, useCallback } from 'react'
import './Hangman.css'

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
]
const MAX_WRONG = 6

function HangmanSVG({ wrong }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gallows */}
      <line x1="20" y1="190" x2="180" y2="190" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"/>
      <line x1="60" y1="190" x2="60" y2="10" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"/>
      <line x1="60" y1="10" x2="130" y2="10" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"/>
      <line x1="130" y1="10" x2="130" y2="35" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"/>
      {/* Head */}
      {wrong >= 1 && <circle cx="130" cy="50" r="15" stroke="#f87171" strokeWidth="3"/>}
      {/* Body */}
      {wrong >= 2 && <line x1="130" y1="65" x2="130" y2="115" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>}
      {/* Left arm */}
      {wrong >= 3 && <line x1="130" y1="75" x2="105" y2="98" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>}
      {/* Right arm */}
      {wrong >= 4 && <line x1="130" y1="75" x2="155" y2="98" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>}
      {/* Left leg */}
      {wrong >= 5 && <line x1="130" y1="115" x2="105" y2="145" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>}
      {/* Right leg */}
      {wrong >= 6 && <line x1="130" y1="115" x2="155" y2="145" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>}
    </svg>
  )
}

export default function Hangman({ config, onComplete }) {
  const words = config?.words ?? []
  const [word, setWord] = useState('')
  const [guessed, setGuessed] = useState(new Set())
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  useEffect(() => {
    if (words.length > 0) {
      const picked = words[Math.floor(Math.random() * words.length)].trim().toUpperCase()
      setWord(picked)
    }
  }, [])

  const wrongLetters = [...guessed].filter(l => !word.includes(l))
  const wrongCount = wrongLetters.length
  const isWordGuessed = word.length > 0 && [...word].every(l => l === ' ' || guessed.has(l))

  const handleKey = useCallback((letter) => {
    if (gameOver || guessed.has(letter)) return
    const next = new Set(guessed)
    next.add(letter)
    setGuessed(next)
    const newWrong = [...next].filter(l => !word.includes(l)).length
    if (newWrong >= MAX_WRONG) {
      setGameOver(true)
      setWon(false)
      const remaining = MAX_WRONG - newWrong
      const score = Math.max(0, Math.round((remaining / MAX_WRONG) * 100))
      setTimeout(() => onComplete(score), 1500)
    } else if ([...word].every(l => l === ' ' || next.has(l))) {
      setGameOver(true)
      setWon(true)
      const remaining = MAX_WRONG - newWrong
      const score = Math.round(50 + (remaining / MAX_WRONG) * 50)
      setTimeout(() => onComplete(score), 1500)
    }
  }, [gameOver, guessed, word, onComplete])

  if (words.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin palabras configuradas.</p>
  }

  return (
    <div className="hangman-container">
      <div className="hangman-drawing">
        <HangmanSVG wrong={wrongCount} />
      </div>

      <p className="hangman-attempts">
        Intentos fallidos: <span>{wrongCount} / {MAX_WRONG}</span>
      </p>

      <div className="hangman-word">
        {[...word].map((letter, i) =>
          letter === ' ' ? (
            <div key={i} style={{ width: '1.5rem' }} />
          ) : (
            <div key={i} className="hangman-letter">
              <span>{guessed.has(letter) ? letter : ''}</span>
              <div className="underline" />
            </div>
          )
        )}
      </div>

      {wrongLetters.length > 0 && (
        <div className="hangman-wrong-letters">
          {wrongLetters.map(l => (
            <span key={l} className="hangman-wrong-letter">{l}</span>
          ))}
        </div>
      )}

      {gameOver ? (
        <div className={`hangman-result ${won ? 'win' : 'lose'}`}>
          {won ? `¡Ganaste! La palabra era: ${word} 🎉` : `¡Perdiste! La palabra era: ${word}`}
        </div>
      ) : (
        <div className="hangman-keyboard">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="hangman-keyboard-row">
              {row.map(letter => {
                const used = guessed.has(letter)
                const isCorrect = used && word.includes(letter)
                const isWrong = used && !word.includes(letter)
                return (
                  <button
                    key={letter}
                    className={`hangman-key ${isCorrect ? 'used-correct' : ''} ${isWrong ? 'used-wrong' : ''}`}
                    onClick={() => handleKey(letter)}
                    disabled={used || gameOver}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
