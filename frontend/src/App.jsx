import { useEffect, useState } from 'react'
import { fetchSpots } from './api/spots.js'
import SpotCard from './components/SpotCard.jsx'
import SurfSessions from './components/SurfSessions.jsx'

const FAVORITES_KEY = 'surfspot-favorites'

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    // Une valeur de stockage illisible ne doit pas empêcher l'application de démarrer.
    return []
  }
}

export default function App() {
  const [spots, setSpots] = useState([])
  const [favorites, setFavorites] = useState(readFavorites)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    fetchSpots()
      .then((data) => {
        if (isMounted) setSpots(data)
      })
      .catch(() => {
        if (isMounted) setError("Impossible de joindre SurfSpot. Vérifiez que le backend Express fonctionne.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function toggleFavorite(spotId) {
    setFavorites((currentFavorites) => {
      const nextFavorites = currentFavorites.includes(spotId)
        ? currentFavorites.filter((id) => id !== spotId)
        : [...currentFavorites, spotId]

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites))
      return nextFavorites
    })
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <nav className="top-nav" aria-label="Navigation principale">
          <a className="brand" href="#accueil" aria-label="SurfSpot, accueil">
            <span className="brand__mark" aria-hidden="true">≈</span> surfspot
          </a>
          <span className="nav-note"><span className="status-dot" /> Données de démonstration</span>
        </nav>

        <div className="hero__content" id="accueil">
          <p className="eyebrow">Votre prochaine session commence ici</p>
          <h1>La bonne vague,<br /><span>au bon endroit.</span></h1>
          <p className="hero__description">Explorez les spots près de vous et trouvez les conditions qui vous donnent envie de vous jeter à l’eau.</p>
          <a className="hero__link" href="#spots">Explorer les spots <span aria-hidden="true">↓</span></a>
        </div>

        <div className="hero__sun" aria-hidden="true" />
        <div className="wave-art" aria-hidden="true">
          <svg viewBox="0 0 1440 230" preserveAspectRatio="none">
            <path d="M0,95 C180,150 280,65 460,105 C650,148 740,222 930,152 C1120,82 1240,42 1440,100 L1440,230 L0,230 Z" />
            <path className="wave-art__foam" d="M0,95 C180,150 280,65 460,105 C650,148 740,222 930,152 C1120,82 1240,42 1440,100" />
          </svg>
        </div>
      </header>

      <section className="spots-section" id="spots">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow--dark">À vous de jouer</p>
            <h2>Spots à découvrir</h2>
          </div>
          {!loading && !error && <span className="spot-count">{spots.length} spots</span>}
        </div>

        <p className="demo-notice" role="note">
          <span className="demo-notice__mark" aria-hidden="true">i</span>
          <span><strong>Données de démonstration — non actualisées.</strong> Les hauteurs de vagues, le vent et les conditions sont des exemples fixes, pas des prévisions en temps réel.</span>
        </p>

        {loading && <p className="state-message" role="status">Chargement des spots…</p>}
        {error && <p className="state-message state-message--error" role="alert">{error}</p>}
        {!loading && !error && spots.length === 0 && (
          <p className="state-message">Aucun spot n’est disponible pour le moment.</p>
        )}
        {!loading && !error && spots.length > 0 && (
          <div className="spot-grid">
            {spots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                isFavorite={favorites.includes(spot.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      <SurfSessions spots={spots} spotsLoading={loading} spotsError={error} />

      <footer className="footer">
        <a className="brand brand--footer" href="#accueil"><span className="brand__mark" aria-hidden="true">≈</span> surfspot</a>
        <span>Fait pour les jours de vagues.</span>
      </footer>
    </main>
  )
}
