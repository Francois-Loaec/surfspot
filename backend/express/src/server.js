const app = require('./app')
const pool = require('./db/pool')
const initializeDatabase = require('./db/initialize')

const port = 3000

initializeDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`SurfSpot API écoute sur 0.0.0.0:${port}.`)
    })
  })
  .catch(async (error) => {
    console.error('Impossible d’initialiser la base PostgreSQL.', error)
    try {
      await pool.end()
    } catch (closeError) {
      console.error('Impossible de fermer le pool PostgreSQL après l’échec.', closeError)
    }
    process.exitCode = 1
  })
