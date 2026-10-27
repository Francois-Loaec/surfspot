export default function SpotCard({ spot, isFavorite, onToggleFavorite }) {
  return (
    <article className="spot-card">
      {/* Zone réservée à une future photo ; le visuel actuel reste décoratif. */}
      <div className="spot-card__media" aria-hidden="true"><span>≈</span></div>

      <div className="spot-card__body">
        <div className="spot-card__topline">
          <span className="spot-card__tag">Spot de surf</span>
          <button
            className={`favorite-button${isFavorite ? ' favorite-button--active' : ''}`}
            type="button"
            aria-label={isFavorite ? `Retirer ${spot.name} des favoris` : `Ajouter ${spot.name} aux favoris`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(spot.id)}
          >
            <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </button>
        </div>

        <h2>{spot.name}</h2>
        <p className="spot-card__location"><span aria-hidden="true">⌖</span> {spot.location}</p>

        <div className="spot-card__conditions">
          <div className="condition">
            <span className="condition__label">Vagues</span>
            <strong>{spot.wave_height}</strong>
          </div>
          <div className="condition">
            <span className="condition__label">Vent</span>
            <strong>{spot.wind}</strong>
          </div>
        </div>

        <p className="spot-card__summary">{spot.conditions}</p>
      </div>
    </article>
  )
}
