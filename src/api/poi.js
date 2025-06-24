const defaultCenter = { lat: 37.5665, lon: 126.9780 };
let map, markers = { origin: null, dest: null, highlight: null };

export function initMap() {
  if (map) return;
  map = new Tmapv2.Map('map', {
    center: new Tmapv2.LatLng(defaultCenter.lat, defaultCenter.lon),
    zoom: 13,
    width: '100%',
    height: '500px'
  });
  map.addListener('click', () => hideInfoBox());
}

// Debounce 함수 개편: 파라미터를 fn에 전달하도록
export function debounce(fn, ms = 300) {
  let timer;
  return (arg) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(arg), ms);
  };
}

export async function fetchPoiSuggestions(query) {
  const res = await fetch(`/api/autocomplete.map?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export function placeMarker(item, type) {
  clearHighlight();
  const pos = new Tmapv2.LatLng(parseFloat(item.lat), parseFloat(item.lon));
  map.setCenter(pos);
  map.setZoom(15);

  markers.highlight = new Tmapv2.Marker({ position: pos, map });
  markers.highlight.addListener('click', () => showInfoBox(item));

  if (markers[type]) markers[type].setMap(null);
  markers[type] = new Tmapv2.Marker({ position: pos, map });
}

export function swapMarkers() {
  [markers.origin, markers.dest] = [markers.dest, markers.origin];
}

function clearHighlight() {
  if (markers.highlight) {
    markers.highlight.setMap(null);
    markers.highlight = null;
  }
}

function showInfoBox(item) {
  // TODO: 하단 정보 박스 표시 구현
}

function hideInfoBox() {
  // TODO: 정보 박스 숨기기 구현
}
