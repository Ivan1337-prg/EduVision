import { useMemo, useState } from 'react'

function Session({ onEndSession, onStartSession, session, sessionLoading, sessionMessage }) {
  const sessionActive = Boolean(session?.session_id)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radiusMeters, setRadiusMeters] = useState('60')
  const [locationAccuracy, setLocationAccuracy] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  const locationValues = useMemo(() => {
    const parsedLatitude = Number(latitude)
    const parsedLongitude = Number(longitude)
    const parsedRadius = Number(radiusMeters)
    const latitudeValid = latitude.trim() !== '' && Number.isFinite(parsedLatitude) && parsedLatitude >= -90 && parsedLatitude <= 90
    const longitudeValid = longitude.trim() !== '' && Number.isFinite(parsedLongitude) && parsedLongitude >= -180 && parsedLongitude <= 180
    const radiusValid = radiusMeters.trim() !== '' && Number.isInteger(parsedRadius) && parsedRadius > 0

    return {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      radius_meters: parsedRadius,
      valid: latitudeValid && longitudeValid && radiusValid,
    }
  }, [latitude, longitude, radiusMeters])

  function clearLocationAccuracy() {
    setLocationAccuracy(null)
    setLocationMessage('Coordinates entered manually.')
  }

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support geolocation.')
      return
    }

    setLocationLoading(true)
    setLocationMessage('Requesting your current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude))
        setLongitude(String(position.coords.longitude))
        setLocationAccuracy(position.coords.accuracy)
        setLocationMessage('Current location loaded.')
        setLocationLoading(false)
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied.',
          2: 'Your current location is unavailable.',
          3: 'The location request timed out.',
        }
        setLocationMessage(messages[error.code] || 'Unable to retrieve your current location.')
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  function handleStartSession() {
    if (!locationValues.valid) {
      return
    }

    onStartSession({
      latitude: locationValues.latitude,
      longitude: locationValues.longitude,
      radius_meters: locationValues.radius_meters,
    })
  }

  const locationControlsDisabled = sessionLoading || sessionActive
  const startDisabled = locationControlsDisabled || locationLoading || !locationValues.valid
  const accuracyStatus = locationAccuracy > 100 ? 'danger' : locationAccuracy > 50 ? 'warning' : ''

  return (
    <section className="card session-card">
      <p className="eyebrow">Session controls</p>
      <h2 className="currentSession">{sessionActive ? 'Your session is live' : 'Ready for your next class?'}</h2>
      <p><strong>Session ID:</strong> {session?.session_id ?? 'Not started yet'}</p>
      <p><strong>Status:</strong> {session?.status ?? 'inactive'}</p>
      <p><strong>Started At:</strong> {session?.start_time ? new Date(session.start_time).toLocaleString() : 'Not started yet'}</p>
      {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}

      <div className="location-form">
        <h3>Session Location</h3>
        <p className="location-intro">Choose where students can check in. Use your current location or enter coordinates below.</p>
        <div className="location-grid">
          <label className="location-field">
            <span>Latitude</span>
            <input
              className="location-input"
              type="number"
              min="-90"
              max="90"
              step="any"
              value={latitude}
              disabled={locationControlsDisabled}
              onChange={(event) => {
                setLatitude(event.target.value)
                clearLocationAccuracy()
              }}
              placeholder="33.210123"
            />
          </label>

          <label className="location-field">
            <span>Longitude</span>
            <input
              className="location-input"
              type="number"
              min="-180"
              max="180"
              step="any"
              value={longitude}
              disabled={locationControlsDisabled}
              onChange={(event) => {
                setLongitude(event.target.value)
                clearLocationAccuracy()
              }}
              placeholder="-97.150456"
            />
          </label>

          <label className="location-field">
            <span className="location-label-row">
              <span>Radius (meters)</span>
              <span className="tooltip-anchor" tabIndex={0}>
                <span className="tooltip-info" aria-hidden="true">?</span>
                <span className="field-tooltip" role="tooltip">
                  <strong>Allowed student distance</strong>
                  <span>50 m: stricter classroom area</span>
                  <span>60 m: recommended same-building default</span>
                  <span>75 m: more tolerant of indoor inaccuracy</span>
                  <span>Above 100 m: usually too broad</span>
                </span>
              </span>
            </span>
            <input
              className="location-input"
              type="number"
              min="1"
              step="1"
              value={radiusMeters}
              disabled={locationControlsDisabled}
              onChange={(event) => setRadiusMeters(event.target.value)}
              placeholder="60"
            />
          </label>
        </div>

        <div className="location-actions">
          <button
            className="Status-button location-button"
            type="button"
            disabled={locationControlsDisabled || locationLoading}
            onClick={handleGetCurrentLocation}
          >
            {locationLoading ? 'Getting Location...' : 'Get Current Location'}
          </button>
          {locationAccuracy !== null ? (
            <span className="tooltip-anchor" tabIndex={0}>
              <span className={`location-accuracy ${accuracyStatus}`.trim()}>
                Estimated accuracy: ±{Math.round(locationAccuracy)} meters
              </span>
              <span className="tooltip-info" aria-hidden="true">?</span>
              <span className="field-tooltip" role="tooltip">
                <strong>Location reading quality</strong>
                <span>0–30 m: good</span>
                <span>31–50 m: acceptable</span>
                <span>51–100 m: retry the location</span>
                <span>Above 100 m: do not start the session</span>
              </span>
            </span>
          ) : null}
        </div>

        {locationMessage ? <p className="location-message">{locationMessage}</p> : null}
        {!locationValues.valid && !sessionActive ? (
          <p className="location-help">Enter valid coordinates and a positive whole-number radius to start a session.</p>
        ) : null}
      </div>

      <div className="session-actions">
        <button className="Status-button" disabled={startDisabled} onClick={handleStartSession}>
          {sessionLoading && !sessionActive ? 'Starting...' : 'Start Session'}
        </button>
        <button className="Status-button muted" disabled={sessionLoading || !sessionActive} onClick={onEndSession}>
          {sessionLoading && sessionActive ? 'Ending...' : 'End Session'}
        </button>
      </div>
    </section>
  )
}

export default Session
