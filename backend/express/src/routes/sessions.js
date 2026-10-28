const express = require('express')
const pool = require('../db/pool')

const router = express.Router()

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

router.get('/sessions', async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT sessions.id, sessions.session_date AS date, sessions.spot_id,
              sessions.note, spots.name AS spot_name, spots.location AS spot_location
       FROM sessions
       JOIN spots ON spots.id = sessions.spot_id
       ORDER BY sessions.session_date DESC, sessions.id DESC`,
    )
    response.json(result.rows)
  } catch (error) {
    next(error)
  }
})

router.post('/sessions', async (request, response, next) => {
  const { date, spot_id: spotId, note } = request.body ?? {}
  const numericSpotId = typeof spotId === 'number' ? spotId : NaN
  const validNote = note === undefined || note === null || typeof note === 'string'

  if (
    !isValidDate(date)
    || !Number.isSafeInteger(numericSpotId)
    || numericSpotId <= 0
    || !validNote
    || (typeof note === 'string' && note.length > 1000)
  ) {
    return response.status(422).json({ detail: 'Les données de la session sont invalides.' })
  }

  const normalizedNote = typeof note === 'string' && note.trim() ? note.trim() : null

  try {
    const result = await pool.query(
      `INSERT INTO sessions (session_date, spot_id, note)
       SELECT $1::date, spots.id, $3
       FROM spots
       WHERE spots.id = $2
       RETURNING id, session_date AS date, spot_id, note`,
      [date, numericSpotId, normalizedNote],
    )

    if (result.rowCount === 0) {
      return response.status(404).json({ detail: 'Le spot sélectionné n’existe pas.' })
    }

    const created = result.rows[0]
    const spotResult = await pool.query(
      `SELECT name AS spot_name, location AS spot_location
       FROM spots
       WHERE id = $1`,
      [created.spot_id],
    )

    return response.status(201).json({ ...created, ...spotResult.rows[0] })
  } catch (error) {
    return next(error)
  }
})

router.delete('/sessions/:sessionId', async (request, response, next) => {
  const sessionId = Number(request.params.sessionId)
  if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
    return response.status(400).json({ detail: 'L’identifiant de session est invalide.' })
  }

  try {
    const result = await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId])
    if (result.rowCount === 0) {
      return response.status(404).json({ detail: 'Cette session n’existe pas.' })
    }
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

module.exports = router
