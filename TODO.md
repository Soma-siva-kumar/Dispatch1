## POI Checker for Dispatcher (Fire Stations / Hospitals / Police)

### Progress
- [ ] Create backend route `server/routes/places.js` for Google Places Nearby Search proxy.
- [ ] Mount the route under `/api/places` in `server/server.js`.
- [ ] Add `axios` dependency to `server/package.json` (for proxy calls).
- [ ] Update `dispatcher/src/pages/ControlRoom.jsx` (POI panel UI + markers).
- [ ] Remove hardcoded Google Maps API key from `dispatcher/src/pages/ControlRoom.jsx`.
- [ ] Run `npm install` in `server/` and verify dev servers compile.
- [ ] Manual test: open dispatcher Control Room, run POI search, confirm markers appear and update.

