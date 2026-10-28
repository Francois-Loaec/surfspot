const express = require('express')
const spotCoordinates = require('../data/spotCoordinates')
const { getForecast } = require('../services/openMeteo')

function createConditionsHandler({ pool, forecast = getForecast }) {
  return async (request, response, next) => {
    if (!/^\d+$/.test(request.params.spotId)) {
      return response.status(400).json({ detail: 'Identifiant de spot invalide.' })
    }
    try {
      const result = await pool.query('SELECT id, name FROM spots WHERE id = $1', [request.params.spotId])
      const spot = result.rows[0]
      if (!spot) return response.status(404).json({ detail: 'Spot introuvable.' })
      const coordinate = spotCoordinates[spot.name]
      if (!coordinate) return response.status(503).json({ detail: 'Coordonnées du spot à confirmer.' })
      const conditions = await forecast(coordinate)
      return response.json(conditions)
    } catch (error) {
      if (error.status === 503) return response.status(503).json({ detail: 'Prévisions temporairement indisponibles.' })
      return next(error)
    }
  }
}

function createConditionsRouter(dependencies) {
  const router = express.Router()
  router.get('/spots/:spotId/conditions', createConditionsHandler(dependencies))

  return router
}

createConditionsRouter.createHandler = createConditionsHandler
module.exports = createConditionsRouter
