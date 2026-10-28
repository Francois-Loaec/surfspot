import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchSpotConditions } from '../api/conditions.js'
import { getSpotPhoto } from '../data/spotPhotos.js'
import { spotProfiles } from '../data/spotProfiles.js'

const NOT_PROVIDED = 'Non disponible'

function formatValue(value, unit, digits = 1) {
  return Number.isFinite(value)
    ? `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value)} ${unit}`
    : NOT_PROVIDED
}

function formatDirection(value) {
  if (!Number.isFinite(value)) return NOT_PROVIDED
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  return `${Math.round(value)}° (${directions[Math.round(value / 22.5) % 16]})`
}

function formatDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return NOT_PROVIDED
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function SpotDetail({ spot, onClose }) {
  const closeButtonRef = useRef(null)
  const [conditions, setConditions] = useState(null)
  const [conditionsState, setConditionsState] = useState('loading')
  const photo = getSpotPhoto(spot.name)
  const profile = spotProfiles[spot.name] ?? {
    description: 'À confirmer.',
    level: 'À confirmer.',
    bottom: 'À confirmer.',
    swell: 'À confirmer.',
    wind: 'À confirmer.',
    tide: 'À confirmer.',
    season: 'À confirmer.',
    source: '',
  }
  const hasPhotoCredit = photo?.src && (
    photo.attributionRequired === true || photo.source || photo.author || photo.license
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    const controller = new AbortController()
    setConditions(null)
    setConditionsState('loading')
    fetchSpotConditions(spot.id, { signal: controller.signal })
      .then((data) => {
        setConditions(data)
        setConditionsState(data.status === 'available' ? 'available' : 'partial')
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setConditionsState(error.status === 503 ? 'unavailable' : 'error')
        }
      })
    return () => controller.abort()
  }, [spot.id])

  return createPortal(
    <div
      className="spot-detail-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="spot-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-detail-title"
        tabIndex={-1}
      >
        <figure className="spot-detail__figure">
          <div className="spot-detail__photo">
            {photo?.src ? (
              <img className="spot-detail__image" src={photo.src} alt={photo.alt} />
            ) : (
              <div className="spot-detail__photo-placeholder" role="img" aria-label={`Photo réelle indisponible pour ${spot.name}`}>
                <span className="spot-detail__photo-mark" aria-hidden="true">≈</span>
                <span>Photo réelle indisponible</span>
              </div>
            )}
            <button
              ref={closeButtonRef}
              className="spot-detail__close"
              type="button"
              aria-label="Fermer la fiche du spot"
              onClick={onClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          {hasPhotoCredit && (
            <figcaption className="spot-detail__photo-credit">
              {photo.author && <span>Photo : {photo.author}</span>}
              {photo.license && (
                <span>
                  Licence :{' '}
                  {photo.licenseUrl ? (
                    <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>
                  ) : photo.license}
                </span>
              )}
              {photo.source && (
                <span>
                  Source :{' '}
                  <a href={photo.source} target="_blank" rel="noreferrer">Wikimedia Commons</a>
                </span>
              )}
            </figcaption>
          )}
        </figure>

        <div className="spot-detail__content">
          <header className="spot-detail__heading">
            <p className="eyebrow eyebrow--dark">Fiche du spot</p>
            <h2 id="spot-detail-title">{spot.name}</h2>
            <p className="spot-detail__location"><span aria-hidden="true">⌖</span> {spot.location}</p>
          </header>

          <section className="spot-detail__section" aria-labelledby="spot-about-title">
            <h3 id="spot-about-title">Repères habituels du spot</h3>
            <p className="spot-detail__section-note">
              Ces indications générales proviennent d’un guide de surf et varient selon la houle, les bancs et les conditions locales.
            </p>
            <dl className="spot-detail__facts">
              <div><dt>Description</dt><dd>{profile.description}</dd></div>
              <div><dt>Niveau conseillé</dt><dd>{profile.level}</dd></div>
              <div><dt>Type de fond</dt><dd>{profile.bottom}</dd></div>
            </dl>
          </section>

          <section className="spot-detail__section" aria-labelledby="spot-ideal-title">
            <h3 id="spot-ideal-title">Conditions habituelles favorables</h3>
            <p className="spot-detail__section-note">
              Ce sont des orientations de fond, pas une prévision. Les tailles de houle ne sont pas normalisées dans les guides consultés.
            </p>
            <dl className="spot-detail__facts spot-detail__facts--grid">
              <div><dt>Houle adaptée</dt><dd>{profile.swell}</dd></div>
              <div><dt>Vent favorable</dt><dd>{profile.wind}</dd></div>
              <div><dt>Marée</dt><dd>{profile.tide}</dd></div>
              <div><dt>Meilleure période</dt><dd>{profile.season}</dd></div>
            </dl>
            {profile.source && (
              <p className="spot-detail__profile-source">
                Référence : <a href={profile.source} target="_blank" rel="noreferrer">guide de surf consulté</a>
              </p>
            )}
          </section>

          <section className="spot-detail__section" aria-labelledby="spot-forecast-title">
            <h3 id="spot-forecast-title">Prévisions marines et météo</h3>
            <p className="spot-detail__section-note">
              Estimations issues de modèles numériques : ce ne sont pas des mesures réalisées sur la plage. La résolution des modèles peut manquer les variations locales des bancs et de la côte.
            </p>
            {conditionsState === 'loading' && <p className="forecast-state" role="status">Chargement des prévisions…</p>}
            {(conditionsState === 'unavailable' || conditionsState === 'error') && (
              <p className="forecast-state forecast-state--error" role="status">
                {conditionsState === 'unavailable' ? 'Les prévisions sont temporairement indisponibles.' : 'Impossible de joindre le service de prévisions. Réessayez plus tard.'}
              </p>
            )}
            {conditions && (
              <>
                {conditionsState === 'partial' && <p className="forecast-state" role="status">Réponse partielle : certaines données ne sont pas disponibles.</p>}
                <dl className="spot-detail__facts spot-detail__facts--grid forecast-facts">
                  <div><dt>Hauteur des vagues</dt><dd>{formatValue(conditions.wave?.heightM, 'm')}</dd></div>
                  <div><dt>Période des vagues</dt><dd>{formatValue(conditions.wave?.periodS, 's', 0)}</dd></div>
                  <div><dt>Direction des vagues</dt><dd>{formatDirection(conditions.wave?.directionDegrees)}</dd></div>
                  <div><dt>Hauteur de houle</dt><dd>{formatValue(conditions.swell?.heightM, 'm')}</dd></div>
                  <div><dt>Période de houle</dt><dd>{formatValue(conditions.swell?.periodS, 's', 0)}</dd></div>
                  <div><dt>Direction de houle</dt><dd>{formatDirection(conditions.swell?.directionDegrees)}</dd></div>
                  <div><dt>Vent à 10 m</dt><dd>{formatValue(conditions.wind?.speedKmh, 'km/h')}</dd></div>
                  <div><dt>Direction du vent</dt><dd>{formatDirection(conditions.wind?.directionDegrees)}</dd></div>
                </dl>
                <dl className="spot-detail__facts forecast-meta">
                  <div><dt>Valide pour</dt><dd>{formatDate(conditions.validAt)}</dd></div>
                  <div><dt>Récupéré le</dt><dd>{formatDate(conditions.retrievedAt)}</dd></div>
                  <div><dt>Point côtier</dt><dd>{conditions.position?.precision === 'approximate' ? 'Position approximative — à confirmer' : 'Point de référence documenté, pas le pic exact'}</dd></div>
                  {conditions.position?.source && <div><dt>Référence GPS</dt><dd><a href={conditions.position.source} target="_blank" rel="noreferrer">Consulter la source du point</a></dd></div>}
                </dl>
                <p className="spot-detail__profile-source forecast-attribution">
                  Source : <a href={conditions.source.attributionUrl} target="_blank" rel="noreferrer">Open-Meteo</a> · Modèles : {conditions.source.marineModel || 'marine non précisé'} et {conditions.source.weatherModel || 'météo non précisé'} · valeurs présentées avec unités et arrondi de lecture. Données sous <a href={conditions.source.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a>.
                </p>
              </>
            )}
          </section>
        </div>
      </section>
    </div>,
    document.body,
  )
}
