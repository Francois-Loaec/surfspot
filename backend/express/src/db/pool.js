const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  throw new Error('La variable DATABASE_URL doit être définie dans l’environnement.')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 4,
})

module.exports = pool
