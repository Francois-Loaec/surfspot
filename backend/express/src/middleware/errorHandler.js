function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ detail: 'Le corps JSON est invalide.' })
  }

  console.error('Erreur API SurfSpot.', error)
  return response.status(500).json({ detail: 'Une erreur interne est survenue.' })
}

module.exports = errorHandler
