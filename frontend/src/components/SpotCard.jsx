import { getSpotPhoto } from '../data/spotPhotos.js'

export default function SpotCard({ spot, isFavorite, onToggleFavorite, onOpen }) {
  const photo = getSpotPhoto(spot.name)

  return (
    <article className="spot-card">
      <div className="spot-card__media" aria-hidden={!photo?.src}>
        {photo?.src ? (
          <img className="spot-card__image" src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
        ) : (
          <>
            <span>≈</span>
            <small>Photo réelle indisponible</small>
          </>
        )}
      </div>

      <div className="spot-card__body">
        <div className="spot-card__topline">
          <span className="spot-card__tag">Spot de surf</span>
        </div>

        <h2>{spot.name}</h2>
        <p className="spot-card__location"><span aria-hidden="true">⌖</span> {spot.location}</p>

        <p className="spot-card__summary">Consulter les prévisions modélisées dans la fiche du spot.</p>
        <span className="spot-card__detail-link">Voir la fiche <span aria-hidden="true">→</span></span>
      </div>

      <button
        className="spot-card__open"
        type="button"
        aria-label={`Ouvrir la fiche de ${spot.name}`}
        aria-haspopup="dialog"
        onClick={onOpen}
      />

      <div className="spot-card__footer">
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
    </article>
  )
}
