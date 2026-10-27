import { useEffect, useState } from 'react'
import { createSession, deleteSession, fetchSessions } from '../api/sessions.js'

function localDateValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatSessionDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function SurfSessions({ spots, spotsLoading, spotsError }) {
  const [sessions, setSessions] = useState([])
  const [date, setDate] = useState(localDateValue)
  const [spotId, setSpotId] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    fetchSessions()
      .then((data) => {
        if (isMounted) setSessions(data)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const created = await createSession({
        date,
        spot_id: Number(spotId),
        note: note.trim() || null,
      })
      setSessions((current) => [created, ...current].sort((left, right) => (
        right.date.localeCompare(left.date) || right.id - left.id
      )))
      setNote('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(session) {
    const confirmed = window.confirm(
      `Supprimer la session du ${formatSessionDate(session.date)} ? Cette action est définitive.`,
    )
    if (!confirmed) return

    setError('')
    setDeletingId(session.id)
    try {
      await deleteSession(session.id)
      setSessions((current) => current.filter((item) => item.id !== session.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="sessions-section" aria-labelledby="sessions-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow--dark">Votre journal</p>
          <h2 id="sessions-title">Sessions de surf</h2>
        </div>
        {!loading && <span className="spot-count">{sessions.length} session{sessions.length === 1 ? '' : 's'}</span>}
      </div>

      <div className="sessions-layout">
        <form className="session-form" onSubmit={handleSubmit}>
          <h3>Ajouter une session</h3>

          <label className="form-field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>Spot</span>
            <select
              value={spotId}
              onChange={(event) => setSpotId(event.target.value)}
              required
              disabled={spotsLoading || spots.length === 0}
            >
              <option value="" disabled>
                {spotsLoading ? 'Chargement des spots…' : 'Choisir un spot'}
              </option>
              {spots.map((spot) => (
                <option key={spot.id} value={spot.id}>{spot.name} — {spot.location}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Note personnelle <small>(facultative)</small></span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Une vague mémorable, les conditions…"
            />
            <small className="form-hint">{note.length}/1000 caractères</small>
          </label>

          {spotsError && <p className="form-error" role="alert">Les spots ne sont pas disponibles : {spotsError}</p>}
          <button className="session-submit" type="submit" disabled={submitting || spotsLoading || spots.length === 0}>
            {submitting ? 'Enregistrement…' : 'Enregistrer la session'}
          </button>
        </form>

        <div className="session-history" aria-live="polite">
          <h3>Historique</h3>
          {error && <p className="form-error" role="alert">{error}</p>}
          {loading && <p className="session-empty" role="status">Chargement de l’historique…</p>}
          {!loading && sessions.length === 0 && <p className="session-empty">Aucune session enregistrée pour le moment.</p>}
          {!loading && sessions.length > 0 && (
            <ol className="session-list">
              {sessions.map((session) => (
                <li className="session-entry" key={session.id}>
                  <div className="session-entry__content">
                    <time className="session-entry__date" dateTime={session.date}>{formatSessionDate(session.date)}</time>
                    <p className="session-entry__spot">{session.spot_name} <span>· {session.spot_location}</span></p>
                    {session.note && <p className="session-entry__note">{session.note}</p>}
                  </div>
                  <button
                    className="session-delete"
                    type="button"
                    onClick={() => handleDelete(session)}
                    disabled={deletingId === session.id}
                    aria-label={`Supprimer la session du ${formatSessionDate(session.date)}`}
                  >
                    {deletingId === session.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
