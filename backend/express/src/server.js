const app = require('./app')
const pool = require('./db/pool')
const initializeDatabase = require('./db/initialize')

const port = 3000

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`SurfSpot API écoute sur le port ${port}.`)
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
