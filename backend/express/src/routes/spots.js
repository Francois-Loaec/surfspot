const express = require('express')
const pool = require('../db/pool')

const router = express.Router()

router.get('/spots', async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, location, wave_height, wind, conditions
       FROM spots
       ORDER BY id`,
    )
    response.json(result.rows)
  } catch (error) {
    next(error)
  }
})

module.exports = router
