import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import './CreateRoom.css'

const GAME_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'hangman', label: 'Ahorcado' },
  { value: 'fill_blanks', label: 'Completar oraciones' },
  { value: 'vocab_match', label: 'Emparejar vocabulario' },
  { value: 'sentence_order', label: 'Ordenar oración' },
  { value: 'translation', label: 'Traducción' },
]

/* ---------- Config editors ---------- */

function MultipleChoiceConfig({ value, onChange }) {
  const questions = value.questions ?? []

  const addQuestion = () => {
    onChange({ questions: [...questions, { question: '', options: ['', '', '', ''], correct: 0 }] })
  }

  const removeQuestion = (i) => {
    onChange({ questions: questions.filter((_, idx) => idx !== i) })
  }

  const updateQuestion = (i, field, val) => {
    const next = questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q)
    onChange({ questions: next })
  }

  const updateOption = (qi, oi, val) => {
    const next = questions.map((q, idx) => {
      if (idx !== qi) return q
      const opts = q.options.map((o, i) => i === oi ? val : o)
      return { ...q, options: opts }
    })
    onChange({ questions: next })
  }

  return (
    <div className="config-section">
      <div className="config-section-header">
        <span className="config-section-label">Preguntas ({questions.length})</span>
        <button type="button" className="config-add-btn" onClick={addQuestion}>
          <Plus size={14} /> Agregar pregunta
        </button>
      </div>
      {questions.map((q, qi) => (
        <div key={qi} className="mc-question-editor">
          <div className="mc-question-top">
            <span className="mc-question-num">Pregunta {qi + 1}</span>
            <button type="button" className="config-remove-btn" onClick={() => removeQuestion(qi)}>
              <Trash2 size={14} />
            </button>
          </div>
          <input
            className="config-input"
            placeholder="Texto de la pregunta"
            value={q.question}
            onChange={e => updateQuestion(qi, 'question', e.target.value)}
          />
          <div className="mc-options-editor">
            {q.options.map((opt, oi) => (
              <div key={oi} className="mc-option-row">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correct === oi}
                  onChange={() => updateQuestion(qi, 'correct', oi)}
                  title="Respuesta correcta"
                />
                <input
                  className="config-input"
                  placeholder={`Opción ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={e => updateOption(qi, oi, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="mc-correct-hint">● = respuesta correcta</p>
        </div>
      ))}
    </div>
  )
}

function HangmanConfig({ value, onChange }) {
  return (
    <div className="config-section">
      <label className="config-label">Palabras (separadas por coma)</label>
      <textarea
        className="config-textarea"
        placeholder="cat, dog, house, school, ..."
        rows={4}
        value={(value.words ?? []).join(', ')}
        onChange={e => onChange({ words: e.target.value.split(',').map(w => w.trim()).filter(Boolean) })}
      />
      <p className="config-hint">Separá las palabras con comas. Se elige una al azar.</p>
    </div>
  )
}

function FillBlanksConfig({ value, onChange }) {
  return (
    <div className="config-section">
      <label className="config-label">Oraciones (una por línea, la palabra entre [corchetes])</label>
      <textarea
        className="config-textarea"
        placeholder={"The [cat] is black\nI [like] pizza\nShe [plays] tennis"}
        rows={6}
        value={(value.sentences ?? []).join('\n')}
        onChange={e => onChange({ sentences: e.target.value.split('\n').filter(Boolean) })}
      />
      <p className="config-hint">La palabra entre [corchetes] será el espacio en blanco.</p>
    </div>
  )
}

function VocabMatchConfig({ value, onChange }) {
  const pairs = value.pairs ?? []

  const addPair = () => onChange({ pairs: [...pairs, { word: '', translation: '' }] })
  const removePair = (i) => onChange({ pairs: pairs.filter((_, idx) => idx !== i) })
  const updatePair = (i, field, val) => {
    onChange({ pairs: pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p) })
  }

  return (
    <div className="config-section">
      <div className="config-section-header">
        <span className="config-section-label">Pares ({pairs.length})</span>
        <button type="button" className="config-add-btn" onClick={addPair}>
          <Plus size={14} /> Agregar par
        </button>
      </div>
      <div className="vocab-pairs">
        {pairs.map((p, i) => (
          <div key={i} className="vocab-pair-row">
            <input
              className="config-input"
              placeholder="Inglés"
              value={p.word}
              onChange={e => updatePair(i, 'word', e.target.value)}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>↔</span>
            <input
              className="config-input"
              placeholder="Español"
              value={p.translation}
              onChange={e => updatePair(i, 'translation', e.target.value)}
            />
            <button type="button" className="config-remove-btn" onClick={() => removePair(i)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentenceOrderConfig({ value, onChange }) {
  return (
    <div className="config-section">
      <label className="config-label">Oraciones completas (una por línea)</label>
      <textarea
        className="config-textarea"
        placeholder={"I am a student\nShe likes music\nWe play soccer on Sundays"}
        rows={6}
        value={(value.sentences ?? []).join('\n')}
        onChange={e => onChange({ sentences: e.target.value.split('\n').filter(Boolean) })}
      />
      <p className="config-hint">El sistema desordena las palabras automáticamente.</p>
    </div>
  )
}

function TranslationConfig({ value, onChange }) {
  const pairs = value.pairs ?? []

  const addPair = () => onChange({ pairs: [...pairs, { spanish: '', english: '' }] })
  const removePair = (i) => onChange({ pairs: pairs.filter((_, idx) => idx !== i) })
  const updatePair = (i, field, val) => {
    onChange({ pairs: pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p) })
  }

  return (
    <div className="config-section">
      <div className="config-section-header">
        <span className="config-section-label">Pares ({pairs.length})</span>
        <button type="button" className="config-add-btn" onClick={addPair}>
          <Plus size={14} /> Agregar par
        </button>
      </div>
      <div className="vocab-pairs">
        {pairs.map((p, i) => (
          <div key={i} className="vocab-pair-row">
            <input
              className="config-input"
              placeholder="Español"
              value={p.spanish}
              onChange={e => updatePair(i, 'spanish', e.target.value)}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            <input
              className="config-input"
              placeholder="Inglés"
              value={p.english}
              onChange={e => updatePair(i, 'english', e.target.value)}
            />
            <button type="button" className="config-remove-btn" onClick={() => removePair(i)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const CONFIG_EDITORS = {
  multiple_choice: MultipleChoiceConfig,
  hangman: HangmanConfig,
  fill_blanks: FillBlanksConfig,
  vocab_match: VocabMatchConfig,
  sentence_order: SentenceOrderConfig,
  translation: TranslationConfig,
}

/* ---------- Main Component ---------- */

export default function CreateRoom() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    gameType: 'multiple_choice',
    password: '',
    coinReward: 5,
  })
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.password.trim()) {
      setError('El nombre y la contraseña son obligatorios.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api('post', '/api/rooms?action=create', {
        name: form.name.trim(),
        game_type: form.gameType,
        password: form.password.trim(),
        coin_reward: Number(form.coinReward),
        config,
      })
      navigate('/teacher/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la sala.')
    } finally {
      setLoading(false)
    }
  }

  const ConfigEditor = CONFIG_EDITORS[form.gameType]

  return (
    <div className="page">
      <Navbar />
      <main className="page-content create-room-content">
        <button className="back-btn" onClick={() => navigate('/teacher/dashboard')}>
          <ArrowLeft size={18} />
          Volver
        </button>

        <h1 className="create-room-title">Crear Nueva Sala</h1>

        <form className="create-room-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la sala</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ej: Vocabulario Unit 3"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de juego</label>
              <select
                className="form-input"
                value={form.gameType}
                onChange={e => { setForm(f => ({ ...f, gameType: e.target.value })); setConfig({}) }}
              >
                {GAME_TYPES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recompensa (HappyFaces 😊)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="500"
                value={form.coinReward}
                onChange={e => setForm(f => ({ ...f, coinReward: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña de la sala</label>
            <input
              className="form-input"
              type="text"
              placeholder="La que le das a los alumnos"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="off"
            />
          </div>

          <div className="config-editor-wrapper">
            <h3 className="config-editor-title">Configuración del juego</h3>
            {ConfigEditor && <ConfigEditor value={config} onChange={setConfig} />}
          </div>

          {error && <div className="create-room-error">{error}</div>}

          <button type="submit" className="create-room-submit" disabled={loading}>
            {loading ? (
              <><Loader2 size={18} className="spin" /> Creando sala...</>
            ) : (
              <><Plus size={18} /> Crear sala</>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
