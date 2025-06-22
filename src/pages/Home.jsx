import React, { useEffect, useRef } from "react";

export default function Home() {
  // 전역 변수
  const mapRef = useRef(null); //  // 지도를 담을 div DOM 참조
  const mapInstance = useRef(null); // 지도 객체
  const userMarkerRef = useRef(null); // 사용자 위치 마커 객체
  // 0. 기본 중심 좌표 (// 실패 시 centerLat, centerLon은 기본값 유지)
  const centerLatRef = useRef(37.504198); // 역삼역 위도
  const centerLonRef = useRef(127.04894); // 역삼역 경도

  // 앱 실행
  useEffect(() => {
    initTmap();
  }, []);

  const initTmap = async () => {
    // 1. 현재 위치 얻기
    try {
      const currentLocation = await getCurrentLocation();
      centerLatRef.current = currentLocation.lat;
      centerLonRef.current = currentLocation.lon;
    } catch (err) {
      console.warn("위치 기본값 사용:", err);
    }

    // 2. 지도 생성
    mapInstance.current = new window.Tmapv2.Map(mapRef.current, {
      center: new window.Tmapv2.LatLng(
        centerLatRef.current,
        centerLonRef.current
      ),
      width: "100%",
      height: "100vh", // ✅ 화면 전체 높이
      zoom: 16,
    });

    // 3. 최초 사용자 위치 마커 생성, 이동시 마커 움직임
    updateUserMarker(centerLatRef.current, centerLonRef.current);
  };

  // ***현재 위치 구하는 함수***
  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("지원하지 않는 브라우저");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  //사용자 위치 마커 생성/업데이트 함수
  const updateUserMarker = (lat, lon) => {
    const map = mapInstance.current;
    if (!map) {
      console.warn("지도(map)가 아직 초기화되지 않았습니다.");
      return;
    }

    const position = new window.Tmapv2.LatLng(lat, lon);

    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.Tmapv2.Marker({
        position,
        icon: "/img/myLocationIcon/currentLocation.png",
        iconSize: new window.Tmapv2.Size(48, 72),
        map,
      });
    } else {
      userMarkerRef.current.setPosition(position);
    }
  };

  // 화면 부분
  return (
    <div>
      {/* <h2>전기차 충전소 홈 </h2> */}
      <div
        id="map_div"
        ref={mapRef}
        style={{
          width: "100%",
          height: "100vh", // 화면 세로 전체 높이
          position: "absolute", // 필수는 아니지만 보통 전체화면에 적합
          top: 0,
          left: 0,
        }}
      ></div>
    </div>
  );
}
