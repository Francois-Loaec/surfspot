/** Récupère la liste des spots auprès de l'API FastAPI via le proxy Vite. */
export async function fetchSpots() {
  const response = await fetch('/api/spots')

  if (!response.ok) {
    throw new Error(`Le serveur a répondu avec le code ${response.status}.`)
  }

  return response.json()
}
