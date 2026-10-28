const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'
const WEATHER_URL = 'https://api.open-meteo.com/v1/meteofrance'
const CACHE_TTL_MS = 15 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000
const cache = new Map()
const inFlight = new Map()

function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function closestHourlyIndex(times, now = Date.now()) {
  if (!Array.isArray(times) || times.length === 0) return -1
  let closest = -1
  let smallestDistance = Infinity
  for (let index = 0; index < times.length; index += 1) {
    const timestamp = Date.parse(times[index])
    if (!Number.isFinite(timestamp)) continue
    const distance = Math.abs(timestamp - now)
    if (distance < smallestDistance) {
      closest = index
      smallestDistance = distance
    }
  }
  return closest
}

function hourlyValue(response, field, index) {
  return finiteOrNull(response?.hourly?.[field]?.[index])
}

function normalizeForecast(marine, weather, { retrievedAt, now = Date.now(), coordinate }) {
  const marineIndex = closestHourlyIndex(marine?.hourly?.time, now)
  const weatherIndex = closestHourlyIndex(weather?.hourly?.time, now)
  const marineTime = marineIndex >= 0 ? marine.hourly.time[marineIndex] : null
  const weatherTime = weatherIndex >= 0 ? weather.hourly.time[weatherIndex] : null
  const wave = {
    heightM: hourlyValue(marine, 'wave_height', marineIndex),
    periodS: hourlyValue(marine, 'wave_period', marineIndex),
    directionDegrees: hourlyValue(marine, 'wave_direction', marineIndex),
  }
  const swell = {
    heightM: hourlyValue(marine, 'swell_wave_height', marineIndex),
    periodS: hourlyValue(marine, 'swell_wave_period', marineIndex),
    directionDegrees: hourlyValue(marine, 'swell_wave_direction', marineIndex),
  }
  const wind = {
    speedKmh: hourlyValue(weather, 'wind_speed_10m', weatherIndex),
    directionDegrees: hourlyValue(weather, 'wind_direction_10m', weatherIndex),
  }
  const hasMarine = Object.values(wave).some((value) => value !== null)
    || Object.values(swell).some((value) => value !== null)
  const hasWeather = Object.values(wind).some((value) => value !== null)

  return {
    status: hasMarine && hasWeather ? 'available' : (hasMarine || hasWeather ? 'partial' : 'unavailable'),
    retrievedAt,
    validAt: marineTime || weatherTime,
    wave,
    swell,
    wind,
    source: {
      name: 'Open-Meteo',
      attributionUrl: 'https://open-meteo.com/',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      marineModel: marine?.model || (marine ? 'Modèle marin Open-Meteo (non précisé)' : null),
      weatherModel: weather?.model ?? 'Météo-France via Open-Meteo',
      modeled: true,
    },
    position: {
      precision: coordinate.precision,
      source: coordinate.source,
      latitude: finiteOrNull(marine?.latitude ?? weather?.latitude),
      longitude: finiteOrNull(marine?.longitude ?? weather?.longitude),
    },
  }
}

async function fetchJson(url, fetchImpl, nowFn, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, { signal: controller.signal })
    if (!response.ok) throw new Error('Forecast provider unavailable')
    return await response.json()
  } finally {
    nowFn.clearTimeout(timeout)
  }
}

function makeUrl(base, coordinate, params) {
  const url = new URL(base)
  url.searchParams.set('latitude', String(coordinate.latitude))
  url.searchParams.set('longitude', String(coordinate.longitude))
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value)
  return url.toString()
}

async function getForecast(coordinate, {
  fetchImpl = globalThis.fetch,
  nowFn = globalThis,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const key = `${coordinate.latitude},${coordinate.longitude}`
  const cached = cache.get(key)
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.value
  if (inFlight.has(key)) return inFlight.get(key)

  const promise = (async () => {
    const retrievedAt = new Date().toISOString()
    const marineUrl = makeUrl(MARINE_URL, coordinate, {
      hourly: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period',
      forecast_hours: '2',
      timezone: 'UTC',
    })
    const weatherUrl = makeUrl(WEATHER_URL, coordinate, {
      hourly: 'wind_speed_10m,wind_direction_10m',
      forecast_hours: '2',
      timezone: 'UTC',
      wind_speed_unit: 'kmh',
    })
    const [marineResult, weatherResult] = await Promise.allSettled([
      fetchJson(marineUrl, fetchImpl, nowFn, requestTimeoutMs),
      fetchJson(weatherUrl, fetchImpl, nowFn, requestTimeoutMs),
    ])
    const marine = marineResult.status === 'fulfilled' ? marineResult.value : null
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null
    const normalized = normalizeForecast(marine, weather, { retrievedAt, coordinate })
    if (normalized.status === 'unavailable') {
      const error = new Error('Conditions temporarily unavailable')
      error.status = 503
      throw error
    }
    cache.set(key, { value: normalized, expiresAt: Date.now() + CACHE_TTL_MS })
    return normalized
  })().finally(() => inFlight.delete(key))

  inFlight.set(key, promise)
  return promise
}

function clearForecastCache() {
  cache.clear()
  inFlight.clear()
}

module.exports = { getForecast, normalizeForecast, closestHourlyIndex, clearForecastCache }
