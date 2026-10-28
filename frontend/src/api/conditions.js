import API_BASE from './base.js'

export async function fetchSpotConditions(spotId, { signal } = {}) {
  const response = await fetch(`${API_BASE}/spots/${encodeURIComponent(spotId)}/conditions`, { signal })
  if (!response.ok) {
    const error = new Error(response.status === 503
      ? 'Les prévisions sont temporairement indisponibles.'
      : `Impossible de récupérer les conditions (${response.status}).`)
    error.status = response.status
    throw error
  }
  return response.json()
}
