const fs = require('node:fs/promises')
const path = require('node:path')
const pool = require('./pool')
const demoSpots = require('../data/demoSpots')

function identityKey(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^\p{L}\p{N}]/gu, '')
}

async function initializeDatabase() {
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(schema)

    for (const spot of demoSpots) {
      await client.query(
        `INSERT INTO spots
          (name, location, wave_height, wind, conditions, name_key, location_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (name_key, location_key) DO NOTHING`,
        [
          spot.name,
          spot.location,
          spot.wave_height,
          spot.wind,
          spot.conditions,
          identityKey(spot.name),
          identityKey(spot.location),
        ],
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = initializeDatabase
