const test = require('node:test')
const assert = require('node:assert/strict')
const coordinates = require('../src/data/spotCoordinates')
const demoSpots = require('../src/data/demoSpots')
const createConditionsRouter = require('../src/routes/conditions')
const { normalizeForecast, closestHourlyIndex, getForecast, clearForecastCache } = require('../src/services/openMeteo')

const coordinate = coordinates['La Côte des Basques']

test('la table des coordonnées couvre les 22 spots de démonstration', () => {
  assert.equal(Object.keys(coordinates).length, 22)
  assert.deepEqual(Object.keys(coordinates).sort(), demoSpots.map(({ name }) => name).sort())
  assert.ok(Object.values(coordinates).every(({ latitude, longitude, source, precision }) => (
    Number.isFinite(latitude) && Number.isFinite(longitude) && source.startsWith('https://')
      && ['documented', 'approximate'].includes(precision)
  )))
})

test('normalise houle, vagues et vent en conservant les valeurs manquantes à null', () => {
  const data = normalizeForecast(
    { latitude: 43.5, longitude: -1.5, model: 'test', hourly: {
      time: ['2026-10-28T10:00Z', '2026-10-28T11:00Z'],
      wave_height: [1.25, null], wave_period: [8, 9], wave_direction: [270, 280],
      swell_wave_height: [0.8], swell_wave_period: [11], swell_wave_direction: [250],
    } },
    { hourly: { time: ['2026-10-28T10:00Z'], wind_speed_10m: [12], wind_direction_10m: [45] } },
    { retrievedAt: '2026-10-28T10:02:00Z', now: Date.parse('2026-10-28T10:03:00Z'), coordinate },
  )
  assert.equal(data.status, 'available')
  assert.equal(data.wave.heightM, 1.25)
  assert.equal(data.swell.periodS, 11)
  assert.equal(data.wind.speedKmh, 12)
  assert.equal(data.source.modeled, true)
  assert.equal(data.source.license, 'CC BY 4.0')
  assert.equal(data.position.precision, 'documented')

  const partial = normalizeForecast(null, {
    hourly: { time: ['2026-10-28T10:00Z'], wind_speed_10m: [null], wind_direction_10m: [90] },
  }, { retrievedAt: '2026-10-28T10:02:00Z', now: Date.parse('2026-10-28T10:03:00Z'), coordinate })
  assert.equal(partial.status, 'partial')
  assert.equal(partial.wave.heightM, null)
  assert.equal(partial.wind.speedKmh, null)
})

test('choisit l’heure disponible la plus proche et ignore les dates invalides', () => {
  assert.equal(closestHourlyIndex(['bad', '2026-10-28T10:00Z', '2026-10-28T11:00Z'], Date.parse('2026-10-28T10:40Z')), 2)
  assert.equal(closestHourlyIndex([]), -1)
})

test('le service met en cache et déduplique les appels Open-Meteo simultanés', async () => {
  clearForecastCache()
  let calls = 0
  const hour = new Date()
  hour.setUTCMinutes(0, 0, 0)
  const timestamp = hour.toISOString().slice(0, 16)
  const fetchImpl = async (url) => {
    calls += 1
    const marine = url.includes('marine-api')
    return {
      ok: true,
      json: async () => marine ? {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        hourly: {
          time: [`${timestamp}:00Z`],
          wave_height: [1], wave_period: [9], wave_direction: [280],
          swell_wave_height: [0.8], swell_wave_period: [11], swell_wave_direction: [270],
        },
      } : {
        hourly: { time: [`${timestamp}:00Z`], wind_speed_10m: [10], wind_direction_10m: [90] },
      },
    }
  }
  const [first, second] = await Promise.all([
    getForecast(coordinate, { fetchImpl }),
    getForecast(coordinate, { fetchImpl }),
  ])
  assert.equal(first.status, 'available')
  assert.strictEqual(first, second)
  assert.equal(calls, 2)
  await getForecast(coordinate, { fetchImpl })
  assert.equal(calls, 2)
  clearForecastCache()
})

test('le service conserve une réponse partielle et transforme un timeout en indisponibilité JSON', async () => {
  clearForecastCache()
  const hour = new Date()
  hour.setUTCMinutes(0, 0, 0)
  const timestamp = `${hour.toISOString().slice(0, 16)}:00Z`
  const partial = await getForecast(coordinate, {
    fetchImpl: async (url) => {
      if (!url.includes('marine-api')) throw new Error('weather endpoint offline')
      return { ok: true, json: async () => ({ hourly: {
        time: [timestamp], wave_height: [1], wave_period: [8], wave_direction: [270],
      } }) }
    },
  })
  assert.equal(partial.status, 'partial')
  assert.equal(partial.wind.speedKmh, null)
  clearForecastCache()

  const hangingFetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
  await assert.rejects(
    getForecast(coordinate, { fetchImpl: hangingFetch, requestTimeoutMs: 5 }),
    (error) => error.status === 503,
  )
  clearForecastCache()
})

async function callHandler(handler, spotId) {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  let forwardedError
  await handler({ params: { spotId } }, response, (error) => { forwardedError = error })
  return { ...response, forwardedError }
}

test('le gestionnaire produit un résultat JSON et utilise la requête SQL paramétrée', async () => {
  const handler = createConditionsRouter.createHandler({
    pool: { query: async (_sql, params) => {
      assert.deepEqual(params, ['7'])
      return { rows: [{ id: 7, name: 'La Côte des Basques' }] }
    } },
    forecast: async () => ({ status: 'available', wave: { heightM: 1.1 } }),
  })
  const response = await callHandler(handler, '7')
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.status, 'available')
  assert.equal(response.forwardedError, undefined)
})

test('la route couvre les erreurs d’identifiant, spot absent et prévision indisponible', async () => {
  const handler = createConditionsRouter.createHandler({
    pool: { query: async () => ({ rows: [] }) },
    forecast: async () => ({ status: 'unavailable' }),
  })
  assert.equal((await callHandler(handler, 'abc')).statusCode, 400)
  assert.equal((await callHandler(handler, '999')).statusCode, 404)

  const knownSpotHandler = createConditionsRouter.createHandler({
    pool: { query: async () => ({ rows: [{ id: 7, name: 'La Côte des Basques' }] }) },
    forecast: async () => { throw Object.assign(new Error('provider failed'), { status: 503 }) },
  })
  assert.equal((await callHandler(knownSpotHandler, '7')).statusCode, 503)

  const dbFailureHandler = createConditionsRouter.createHandler({
    pool: { query: async () => { throw new Error('db unavailable') } },
  })
  const dbFailure = await callHandler(dbFailureHandler, '7')
  assert.match(dbFailure.forwardedError.message, /db unavailable/)
})
