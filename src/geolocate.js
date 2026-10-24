// Browser geolocation + free reverse-geocoding (BigDataCloud client endpoint, no API key).

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Location is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please type your city.'
            : err.code === err.TIMEOUT
              ? 'Location timed out. Please type your city.'
              : 'Could not get your location. Please type your city.'
        reject(new Error(msg))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  })
}

// Returns { latitude, longitude, city, area, state } — city/area may be '' if lookup fails.
export async function detectLocation() {
  const { latitude, longitude } = await getPosition()
  let city = ''
  let area = ''
  let state = ''
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    const res = await fetch(url)
    if (res.ok) {
      const d = await res.json()
      city = d.city || d.locality || d.principalSubdivision || ''
      area = d.locality && d.locality !== city ? d.locality : ''
      state = d.principalSubdivision || ''
    }
  } catch {
    /* keep coordinates even if reverse-geocode fails */
  }
  return { latitude, longitude, city, area, state }
}
