const express = require('express')
const path = require('node:path')
const healthRoutes = require('./routes/health')
const spotRoutes = require('./routes/spots')
const sessionRoutes = require('./routes/sessions')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const frontendDist = path.resolve(__dirname, '../../../frontend/dist')
const frontendIndex = path.join(frontendDist, 'index.html')

app.use(express.json())
app.use('/api', healthRoutes)
app.use('/api', spotRoutes)
app.use('/api', sessionRoutes)

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
