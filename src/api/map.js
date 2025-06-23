import axios from "axios";

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
  markersRef,
  setSelectedStation,
  filterOptions = {}
) => {
  try {
    const response = await fetch("/api/station/getStationNear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lat: centerLat,
        lon: centerLon,
        ...filterOptions,
      }),
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

      if (typeof setSelectedStation === "function") {
        marker.addListener("click", () => {
          console.log("📍 마커 클릭됨:", station); // ← 콘솔에서 이게 보이는지 확인
          setSelectedStation(station);
        });
      }

      markersRef.current.push(marker); // ref 배열에 저장
    });
  } catch (error) {
    console.error("서버 전송 에러:", error);
  }
}; //sendCenterToServer 함수 끝

//***드래그, 줌, 이동 등 모든 조작 끝난 후 화면 중심 위도 경도 구하기 함수***
export const registerMapCenterListener = (
  map,
  setStationNear,
  getStationNear,
  mapInstanceRef,
  markersRef,
  setSelectedStation,
  filterOptionsRef
) => {
  let debounceTimer = null;

  const handleCenterChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const center = map.getCenter();
      const centerLat = center.lat();
      const centerLon = center.lng();
      console.log("📍 중심 좌표 (디바운스):", centerLat, centerLon);

      // 1. 위치 기준 충전소 캐싱 요청
      await setStationNear(centerLat, centerLon);

      // 2. 다시 그리기
      await getStationNear(
        centerLat,
        centerLon,
        mapInstanceRef,
        markersRef,
        setSelectedStation,
        filterOptionsRef.current
      );
    }, 300);
  };

  map.addListener("dragend", handleCenterChange);
  map.addListener("zoom_changed", handleCenterChange);
};

//실시간 위치 추적 함수
export const trackUserMovement = (
  mapInstanceRef,
  userMarkerRef,
  setStationNear,
  getStationNear,
  markersRef,
  setSelectedStation,
  filterOptionsRef
) => {
  const lastUserUpdateTimeRef = { current: 0 }; // 로컬 ref 대체
  const USER_UPDATE_INTERVAL = 10000; // 10초

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;
        console.log("사용자 이동 감지:", newLat, newLon);

        // 사용자 마커 갱신 / 출력
        const map = mapInstanceRef.current;
        if (!map) return;

        const positionObj = new window.Tmapv2.LatLng(newLat, newLon);
        if (!userMarkerRef.current) {
          userMarkerRef.current = new window.Tmapv2.Marker({
            position: positionObj,
            icon: "/img/myLocationIcon/currentLocation.png",
            iconSize: new window.Tmapv2.Size(48, 72),
            map,
          });
        } else {
          userMarkerRef.current.setPosition(positionObj);
        }

        // 사용자 위치로 지도 이동. -> 검색에 방해됨
        // map.setCenter(positionObj);

        // 일정 시간 간격으로만 서버 요청
        const now = Date.now();
        if (now - lastUserUpdateTimeRef.current >= USER_UPDATE_INTERVAL) {
          lastUserUpdateTimeRef.current = now;
          setStationNear(newLat, newLon);
          getStationNear(
            newLat,
            newLon,
            mapInstanceRef,
            markersRef,
            setSelectedStation,
            filterOptionsRef.current
          );
        } else {
          console.log("사용자 위치 변경: 서버 요청 대기 중...");
        }
      },
      (error) => {
        console.error("실시간 위치 추적 실패:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  } else {
    alert("이 브라우저는 실시간 위치 추적을 지원하지 않습니다.");
  }
};
