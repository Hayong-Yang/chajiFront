import axios from "axios";

axios.defaults.baseURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8082";

//프론트에서 현재 위치 전송 + 근처 충전소 세팅 함수
export const setStationNear = async (lat, lon) => {
  try {
    // 수정: fetch -> axios.post 사용
    await axios.post("/api/station/setStationNear", { lat, lon });
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
  filterOptions = {},
  originMarkerRef,   
  destMarkerRef,
  neworiginMarkerRef,
  newdestMarkerRef
) => {
    if (!mapInstance?.current) {
    console.warn("🚨 mapInstance.current가 없습니다!");
    return;
  }
if (!markersRef?.current || !Array.isArray(markersRef.current)) {
    console.warn("🚨 markersRef.current가 비정상입니다:", markersRef?.current);
    return;
  }

  try {
    const response = await axios.post("/api/station/getStationNear", {
      lat: centerLat,
      lon: centerLon,
      freeParking: filterOptions.freeParking,
      noLimit: filterOptions.noLimit,
      outputMin: filterOptions.outputMin,
      outputMax: filterOptions.outputMax,
      type: filterOptions.type,
      provider: filterOptions.provider,
    });

    const stations = response.data;
    console.log("서버 응답:", stations);

    // 출발,도착 마커는 따로 관리
markersRef.current.forEach((entry) => {
  const marker = entry.marker;
  const isOrigin = marker === originMarkerRef.current;
  const isDest = marker === destMarkerRef.current;
  if (!isOrigin && !isDest) {
    marker.setMap(null); // 일반 마커만 제거
  }
});

       markersRef.current = markersRef.current.filter(
      (entry) =>
        entry.marker === originMarkerRef.current ||
        entry.marker === destMarkerRef.current
    );

    // 버전 1. 새 마커 찍기+   // 새 마커 찍기

   stations.forEach((station) => {
    const statIdStr = station.statId?.toString();
    const isOrigin = originMarkerRef.current?.dataStatId?.toString() === statIdStr;
    const isDest   = destMarkerRef.current?.dataStatId?.toString() === statIdStr;
    if (isOrigin || isDest) return;
    
    const exists = markersRef.current.some(
    (e) => e.data.statId?.toString() === statIdStr);
     if (exists) return;

     const position = new window.Tmapv2.LatLng(station.lat, station.lng);
     const marker  = new window.Tmapv2.Marker({
       position:   position,
       map:        mapInstance.current,
       icon:       station.logoUrl,
       iconSize:   new window.Tmapv2.Size(48, 72),
       iconAnchor: new window.Tmapv2.Point(24, 72),
     });

     marker.addListener("click", () => {
       mapInstance.current.setCenter(position);
setSelectedStation?.({
  statId: station.statId,
  chgerId: station.chgerId,
  statNm: station.statNm,      // ← 이름 (name 아님)
  addr:   station.addr,        // ← 주소 (address 아님)
  lat:    station.lat,
  lon:    station.lng,         // ← lng를 사용
  tel:    "-",                 // ← 전화번호 없으니 placeholder라도
  bnm:    station.businNm      // ← 사업자 이름도 표시하고 싶으면
});
    });

     // 이제 entry 형태로 저장
     markersRef.current.push({ data: station, marker: marker });
   });

  } catch (error) {
    console.error("서버 전송 에러:", error);
    return [];
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
  filterOptionsRef,
  originMarkerRef,      // 추가
  destMarkerRef  
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
        filterOptionsRef.current,
        originMarkerRef,    
        destMarkerRef
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
  filterOptionsRef,
  originMarkerRef,  
  destMarkerRef  
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
            filterOptionsRef.current,
            originMarkerRef,    // ← 반드시 추가
            destMarkerRef 
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
