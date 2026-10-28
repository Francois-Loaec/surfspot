const express = require('express')
const path = require('node:path')
const healthRoutes = require('./routes/health')
const spotRoutes = require('./routes/spots')
const sessionRoutes = require('./routes/sessions')
const createConditionsRouter = require('./routes/conditions')
const pool = require('./db/pool')
const errorHandler = require('./middleware/errorHandler')
const conditionsRoutes = createConditionsRouter({ pool })

const app = express()
const frontendDist = path.resolve(__dirname, '../../../frontend/dist')
const frontendIndex = path.join(frontendDist, 'index.html')

app.use(express.json())
for (const apiPrefix of ['/api', '/surfspot/api']) {
  app.use(apiPrefix, healthRoutes)
  app.use(apiPrefix, spotRoutes)
  app.use(apiPrefix, conditionsRoutes)
  app.use(apiPrefix, sessionRoutes)
}

app.use('/surfspot/api', (request, response) => {
  response.status(404).json({ detail: 'Route API introuvable.' })
})

app.use('/surfspot', express.static(frontendDist))

function serveReactRoute(request, response, next) {
  if (!request.accepts('html')) return next()

  response.sendFile(frontendIndex, (error) => {
    if (error) next(error)
  })
}

app.get('/surfspot', serveReactRoute)
app.get('/surfspot/{*splat}', serveReactRoute)

app.use(errorHandler)

module.exports = app
