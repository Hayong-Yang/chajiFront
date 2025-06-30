import { getStationNear } from "../api/map";
import axios from "axios";

let detailedMarkers = [];
let summaryZscodeMarkers = [];
let summaryZcodeMarkers = [];
let currentRequestId = 0;
let lastZoomLevel = null;

function clearMarkers(markers) {
  markers
    .filter(Boolean) // ⛔ null/undefined 방지
    .forEach((m) => {
      try {
        if (m?.setMap) m.setMap(null);

        const iconElement = m?.getIcon?.();
        if (iconElement instanceof HTMLElement && iconElement.parentNode) {
          iconElement.parentNode.removeChild(iconElement);
        }
      } catch (e) {
        console.warn("❌ 마커 제거 중 에러:", e);
      }
    });
}


export async function handleZoomChange(
  mapInstance,
  markersRef,
  setSelectedStation,
  filterOptionsRef,
  originMarkerRef,
  destMarkerRef,
  memberCompanyRef
) {
  const map = mapInstance.current;
  if (!map) return;

  const zoom = Math.floor(map.getZoom());
  if (zoom === lastZoomLevel) return;
  lastZoomLevel = zoom;

  const center = map.getCenter();
  const lat = center.lat();
  const lng = center.lng();
  const requestId = ++currentRequestId;

  if (zoom >= 14) {
    console.log("🔎 상세 마커 표시 (zoom >= 14)");
    clearMarkers(summaryZscodeMarkers);
    summaryZscodeMarkers = [];
    clearMarkers(summaryZcodeMarkers);
    summaryZcodeMarkers = [];

    await getStationNear(
      lat, lng, mapInstance, markersRef,
      setSelectedStation, filterOptionsRef.current,
      originMarkerRef, destMarkerRef, memberCompanyRef
    );

    if (requestId !== currentRequestId) return;

    detailedMarkers = (markersRef.current || [])
      .map((entry) => entry.marker)
      .filter(Boolean);
  }

  else if (zoom >= 11 && zoom <= 13) {
    console.log("📍 Zscode 요약 마커 표시 (zoom 11~13)");
    clearMarkers(detailedMarkers);
    detailedMarkers = [];
    clearMarkers(summaryZcodeMarkers);
    summaryZcodeMarkers = [];

    const response = await axios.get("/api/zoom", {
      params: { lat, lng, zoomLevel: zoom }
    });
    if (requestId !== currentRequestId) return;

    const summaryData = response.data;
    if (!Array.isArray(summaryData)) return;

    summaryZscodeMarkers = summaryData.map(createLabelMarker(map)).filter(Boolean);
  }

  else if (zoom <= 10) {
    console.log("📍 Zcode 요약 마커 표시 (zoom <= 10)");
    clearMarkers(detailedMarkers);
    detailedMarkers = [];
    clearMarkers(summaryZscodeMarkers);
    summaryZscodeMarkers = [];

    const response = await axios.get("/api/zoom", {
      params: { lat, lng, zoomLevel: zoom }
    });
    if (requestId !== currentRequestId) return;

    const summaryData = response.data;
    if (!Array.isArray(summaryData)) return;

    summaryZcodeMarkers = summaryData.map(createLabelMarker(map)).filter(Boolean);
  }
  console.log("🔍 요약 Zscode 마커 생성 수:", summaryZscodeMarkers.length);
console.log("🔍 요약 Zcode 마커 생성 수:", summaryZcodeMarkers.length);
}

function createLabelMarker(map) {
  return (item) => {
    const lat = item.lat;
    const lng = item.lng ?? item.lon;
    const name = item.name ?? "알 수 없음";
    const count = item.count ?? 1;

    if (!lat || !lng || lng === 0) return null;

    const position = new window.Tmapv2.LatLng(lat, lng);
    const labelHtml = `
      <div style="
        background: white;
        border: 2px solid red;
        border-radius: 16px;
        padding: 4px 8px;
        font-size: 13px;
        font-weight: bold;
        color: red;
        white-space: nowrap;
        box-shadow: 2px 2px 3px rgba(0,0,0,0.3);
      ">
        ${name}<br/>(${count}개)
      </div>
    `;

    return new window.Tmapv2.Marker({
      position,
      map,
      iconHTML: labelHtml,
      iconSize: new window.Tmapv2.Size(100, 40),
      iconAnchor: new window.Tmapv2.Point(50, 40),
      zIndex: 3000,
    });
  };
}
