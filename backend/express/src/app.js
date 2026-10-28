const express = require('express')
const path = require('node:path')
const healthRoutes = require('./routes/health')
const spotRoutes = require('./routes/spots')
const sessionRoutes = require('./routes/sessions')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(express.json())
app.use('/api', healthRoutes)
app.use('/api', spotRoutes)
app.use('/api', sessionRoutes)

const frontendDist = path.resolve(__dirname, '../../../frontend/dist')
app.use(express.static(frontendDist))

app.get('/{*splat}', (request, response, next) => {
  const isApiPath = request.path === '/api' || request.path.startsWith('/api/')
  if (isApiPath || !request.accepts('html')) return next()

  response.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next(error)
  })
})

app.use(errorHandler)

module.exports = app
