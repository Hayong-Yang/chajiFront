export async function fetchAutocomplete(query) {
  if (query.length < 2) return [];
  const res = await fetch(`/api/autocomplete.map?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return await res.json();
}

// 지도 이동 유틸 함수 (전역 Tmap 객체 map이 존재할 경우에만 동작)
export function moveMapTo(lat, lon) {
  if (!window.Tmapv2 || !window.map) {
    console.warn("지도 객체가 초기화되지 않았습니다.");
    return;
  }
  const pos = new window.Tmapv2.LatLng(lat, lon);
  window.map.setCenter(pos);
  window.map.setZoom(15);
}

    
