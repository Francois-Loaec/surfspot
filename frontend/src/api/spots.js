import API_BASE from './base.js'

/** Récupère la liste des spots auprès de l'API Express via le proxy Vite. */
export async function fetchSpots() {
  const response = await fetch(`${API_BASE}/spots`)

  if (!response.ok) {
    throw new Error(`Le serveur a répondu avec le code ${response.status}.`)
  }

  return response.json()
}
