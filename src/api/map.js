import axios from "axios";

const BASE_URL = "http://localhost:8080/api/map";

//프론트에서 현재 위치 전송 + 근처 충전소 세팅 함수
export const setStationNear = async (lat, lon) => {
  try {
    const response = await fetch("/api/station/setStationNear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lon }),
    });

    if (!response.ok) {
      throw new Error("요청 실패");
    }
    console.log("서버 setStationNear 성공");
  } catch (e) {
    console.error("setStationNear 오류:", e);
  }
};

//***실시간으로 중심 위경도를 백으로 보내는 함수***
export const getStationNear = async (
  centerLat,
  centerLon,
  mapInstance,
  markersRef
) => {
  try {
    const response = await fetch("/api/station/getStationNear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat: centerLat, lon: centerLon }),
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태코드: ${response.status}`);
    }

    const stations = await response.json();
    console.log("서버 응답:", stations);

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = []; // 초기화

    // 버전 1. 새 마커 찍기
    stations.forEach((station) => {
      const marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(station.lat, station.lng),
        // label: station.bnm,
        title: station.bnm,
        icon: station.logoUrl,
        iconSize: new Tmapv2.Size(48, 72),
        map: mapInstance.current,
      });

      marker.addListener("click", function () {
        showStationInfoUI(station);
      });

      markersRef.current.push(marker); // ref 배열에 저장
    });
  } catch (error) {
    console.error("서버 전송 에러:", error);
  }
}; //sendCenterToServer 함수 끝
