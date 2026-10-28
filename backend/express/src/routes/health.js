const express = require('express')
const pool = require('../db/pool')

const router = express.Router()

router.get('/health', async (request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
