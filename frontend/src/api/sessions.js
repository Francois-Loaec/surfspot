import API_BASE from './base.js'

async function readResponse(response) {
  if (!response.ok) {
    let message = `Le serveur a répondu avec le code ${response.status}.`
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') {
        message = body.detail
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((issue) => issue.msg).join(' ')
      }
    } catch {
      // Utilise le message HTTP si la réponse n'a pas de corps JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export async function fetchSessions() {
  return readResponse(await fetch(`${API_BASE}/sessions`))
}

export async function createSession(session) {
  return readResponse(await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  }))
}

export async function deleteSession(sessionId) {
  return readResponse(await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
  }))
}
