const express = require('express');
const router = express.Router();
const axios = require('axios');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

function mapTypeToGoogleType(type) {
  // Google Nearby Search `type` parameter
  // We'll map dispatcher categories to the closest Google Places types.
  switch (type) {
    case 'fire_station':
    case 'fire_station_safe':
      return 'fire_station';
    case 'hospital':
    case 'hospital_safe':
      return 'hospital';
    case 'police_station':
    case 'police_station_safe':
      return 'police';
    default:
      return null;
  }
}

router.get('/nearby', async (req, res) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({ message: 'GOOGLE_PLACES_API_KEY is not configured on server.' });
    }

    const { lat, lng, radius = 1500, type = 'hospital' } = req.query;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ message: 'lat and lng query params are required.' });
    }
    if (!Number.isFinite(radiusNum) || radiusNum <= 0) {
      return res.status(400).json({ message: 'radius must be a positive number.' });
    }

    const googleType = mapTypeToGoogleType(type);
    if (!googleType) {
      return res.status(400).json({ message: 'Invalid type. Use fire_station | hospital | police_station.' });
    }

    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

    const { data } = await axios.get(url, {
      params: {
        key: GOOGLE_PLACES_API_KEY,
        location: `${latNum},${lngNum}`,
        radius: Math.min(Math.max(radiusNum, 50), 5000),
        type: googleType,
        // Note: For Nearby Search, `rankBy=distance` is not supported together with `radius`.
        // We'll rely on radius + type.
      },
    });


    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(502).json({ message: 'Google Places API error', googleStatus: data.status, details: data });
    }

    const results = (data.results || []).map((p) => ({
      placeId: p.place_id,
      name: p.name,
      address: p.vicinity || p.formatted_address || null,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      rating: p.rating ?? null,
      types: p.types ?? [],
    }));

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Places lookup failed' });
  }
});

module.exports = router;

