export async function fetchZoomMarkers(lat, lon, zoomLevel) {
  try {
    const response = await fetch(`/api/zoom?lat=${lat}&lon=${lon}&zoom=${zoomLevel}`);
    const json = await response.json();
    return json;
  } catch (e) {
    console.error('Zoom Marker API Error:', e);
    return [];
  }
}
