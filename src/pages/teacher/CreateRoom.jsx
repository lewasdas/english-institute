import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react'
import TeacherSidebar from '../../components/layout/TeacherSidebar.jsx'
import { api } from '../../lib/api.js'
import './teacher-layout.css'
import './CreateRoom.css'

const GAME_TYPES = [
  { value: 'multiple_choice', label: 'Quiz / Multiple Choice', color: '#8B5CF6' },
  { value: 'hangman', label: 'Ahorcado', color: '#EF4444' },
  { value: 'fill_blanks', label: 'Completar oraciones', color: '#F59E0B' },
  { value: 'vocab_match', label: 'Emparejar vocabulario', color: '#10B981' },
  { value: 'sentence_order', label: 'Ordenar oracion', color: '#3B82F6' },
  { value: 'translation', label: 'Traduccion', color: '#EC4899' },
]

const STEPS = ['Info basica', 'Configurar juego', 'Confirmar']

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
    onChange({ questions: questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q) })
  }

  const updateOption = (qi, oi, val) => {
    onChange({
      questions: questions.map((q, idx) => {
        if (idx !== qi) return q
        return { ...q, options: q.options.map((o, i) => i === oi ? val : o) }
      }),
    })
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
                  placeholder={`Opcion ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={e => updateOption(qi, oi, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="mc-correct-hint">El radio marcado = respuesta correcta</p>
        </div>
      ))}
      {questions.length === 0 && (
        <p className="config-empty-hint">Agrega al menos una pregunta para continuar.</p>
      )}
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
      <p className="config-hint">Se elige una al azar para cada alumno.</p>
    </div>
  )
}

function FillBlanksConfig({ value, onChange }) {
  return (
    <div className="config-section">
      <label className="config-label">Oraciones (una por linea, la palabra entre [corchetes])</label>
      <textarea
        className="config-textarea"
        placeholder={"The [cat] is black\nI [like] pizza\nShe [plays] tennis"}
        rows={6}
        value={(value.sentences ?? []).join('\n')}
        onChange={e => onChange({ sentences: e.target.value.split('\n').filter(Boolean) })}
      />
      <p className="config-hint">La palabra entre [corchetes] sera el espacio en blanco.</p>
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
            <input className="config-input" placeholder="Ingles" value={p.word} onChange={e => updatePair(i, 'word', e.target.value)} />
            <span className="pair-arrow">↔</span>
            <input className="config-input" placeholder="Espanol" value={p.translation} onChange={e => updatePair(i, 'translation', e.target.value)} />
            <button type="button" className="config-remove-btn" onClick={() => removePair(i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentenceOrderConfig({ value, onChange }) {
  return (
    <div className="config-section">
      <label className="config-label">Oraciones completas (una por linea)</label>
      <textarea
        className="config-textarea"
        placeholder={"I am a student\nShe likes music\nWe play soccer on Sundays"}
        rows={6}
        value={(value.sentences ?? []).join('\n')}
        onChange={e => onChange({ sentences: e.target.value.split('\n').filter(Boolean) })}
      />
      <p className="config-hint">El sistema desordena las palabras automaticamente.</p>
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
            <input className="config-input" placeholder="Espanol" value={p.spanish} onChange={e => updatePair(i, 'spanish', e.target.value)} />
            <span className="pair-arrow">→</span>
            <input className="config-input" placeholder="Ingles" value={p.english} onChange={e => updatePair(i, 'english', e.target.value)} />
            <button type="button" className="config-remove-btn" onClick={() => removePair(i)}><Trash2 size={14} /></button>
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

/* ---------- Stepper ---------- */

function Stepper({ current }) {
  return (
    <div className="cr-stepper">
      {STEPS.map((label, i) => (
        <div key={i} className={`cr-step ${i < current ? 'cr-step--done' : ''} ${i === current ? 'cr-step--active' : ''}`}>
          <div className="cr-step-circle">
            {i < current ? <CheckCircle size={16} /> : <span>{i + 1}</span>}
          </div>
          <span className="cr-step-label">{label}</span>
          {i < STEPS.length - 1 && <div className="cr-step-line" />}
        </div>
      ))}
    </div>
  )
}

/* ---------- Main Component ---------- */

export default function CreateRoom() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    gameType: 'multiple_choice',
    password: '',
    coinReward: 5,
  })
  const [config, setConfig] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const gameTypeMeta = GAME_TYPES.find(g => g.value === form.gameType) || GAME_TYPES[0]

  const handleNext = () => {
    if (step === 0) {
      if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
      if (!form.password.trim()) { setError('La contrasena es obligatoria.'); return }
    }
    setError('')
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
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
      setLoading(false)
    }
  }

  const ConfigEditor = CONFIG_EDITORS[form.gameType]

  return (
    <div className="teacher-layout">
      <TeacherSidebar />
      <div className="teacher-main">
        <header className="teacher-header">
          <div className="teacher-header-left">
            <button className="cr-back-btn" onClick={() => navigate('/teacher/dashboard')}>
              <ArrowLeft size={16} />
              Volver a mis salas
            </button>
          </div>
        </header>

        <main className="teacher-content">
          <div className="cr-wrapper">
            <div className="cr-card">
              <div className="cr-card-header">
                <h1 className="cr-title">Crear Nueva Sala</h1>
                <p className="cr-description">Configura tu sala de juego para tus alumnos</p>
              </div>

              <Stepper current={step} />

              {error && <div className="cr-error">{error}</div>}

              {/* Step 1: Info basica */}
              {step === 0 && (
                <div className="cr-step-content">
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

                  <div className="form-group">
                    <label className="form-label">Contrasena de la sala</label>
                    <div className="input-password-wrapper">
                      <input
                        className="form-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="La que le das a los alumnos"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="input-password-toggle"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
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
                  </div>
                </div>
              )}

              {/* Step 2: Config juego */}
              {step === 1 && (
                <div className="cr-step-content">
                  <div className="cr-game-badge" style={{ background: gameTypeMeta.color + '1A', color: gameTypeMeta.color }}>
                    {gameTypeMeta.label}
                  </div>
                  <h3 className="cr-config-title">Configuracion del juego</h3>
                  {ConfigEditor && <ConfigEditor value={config} onChange={setConfig} />}
                </div>
              )}

              {/* Step 3: Confirmar */}
              {step === 2 && (
                <div className="cr-step-content">
                  <h3 className="cr-config-title">Resumen de la sala</h3>
                  <div className="cr-summary">
                    <div className="cr-summary-row">
                      <span className="cr-summary-label">Nombre</span>
                      <span className="cr-summary-value">{form.name}</span>
                    </div>
                    <div className="cr-summary-row">
                      <span className="cr-summary-label">Tipo de juego</span>
                      <span className="cr-summary-value" style={{ color: gameTypeMeta.color, fontWeight: 700 }}>
                        {gameTypeMeta.label}
                      </span>
                    </div>
                    <div className="cr-summary-row">
                      <span className="cr-summary-label">Contrasena</span>
                      <code className="cr-summary-code">{form.password}</code>
                    </div>
                    <div className="cr-summary-row">
                      <span className="cr-summary-label">Recompensa</span>
                      <span className="cr-summary-value">{form.coinReward} HF 😊</span>
                    </div>
                  </div>
                  <p className="cr-confirm-hint">
                    Todo listo. Al confirmar, la sala quedara activa y los alumnos podran unirse con la contrasena.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="cr-actions">
                {step > 0 && (
                  <button className="cr-btn cr-btn--outline" onClick={handleBack} disabled={loading}>
                    <ArrowLeft size={16} />
                    Atras
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button className="cr-btn cr-btn--primary" onClick={handleNext}>
                    Siguiente
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="cr-btn cr-btn--primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <><Loader2 size={16} className="spin" /> Creando...</>
                    ) : (
                      <><CheckCircle size={16} /> Confirmar y crear</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
