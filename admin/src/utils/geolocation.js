/**
 * Utility to get accurate device location using a multi-layered fallback strategy:
 * 1. Native navigator.geolocation.getCurrentPosition with high accuracy and low timeout.
 * 2. Google Geolocation API (if VITE_GOOGLE_MAPS_API_KEY is configured).
 * 3. Free IP-based Geolocation (ipapi.co/json/).
 * 
 * Returns a promise resolving to coordinates or null if all attempts fail.
 */

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Returns [longitude, latitude] (GeoJSON/MongoDB standard)
 */
export async function getDeviceCoordinates() {
  // Try standard browser geolocation first
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });
      });
      return [position.coords.longitude, position.coords.latitude];
    } catch (err) {
      console.warn('Browser geolocation failed or timed out:', err.message);
    }
  }

  // Try Google Geolocation API if a key is provided
  if (GOOGLE_KEY && GOOGLE_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    try {
      const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        if (data.location && data.location.lng && data.location.lat) {
          console.log('Location resolved via Google Geolocation API');
          return [data.location.lng, data.location.lat];
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Google Geolocation API request failed:', errData);
      }
    } catch (err) {
      console.warn('Google Geolocation API failed:', err.message);
    }
  }

  // Try IP Geolocation API as a free fallback
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.longitude && data.latitude) {
        console.log('Location resolved via IP Geolocation API (ipapi.co)');
        return [data.longitude, data.latitude];
      }
    }
  } catch (err) {
    console.warn('IP Geolocation failed:', err.message);
  }

  return null;
}

/**
 * Returns [latitude, longitude] (Leaflet standard)
 */
export async function getDeviceLatLng() {
  const coords = await getDeviceCoordinates();
  if (!coords) return null;
  return [coords[1], coords[0]];
}
