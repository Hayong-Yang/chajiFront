import React, { useEffect, useRef } from "react";

export default function Home() {
  const mapRef = useRef(null); //  // 지도를 담을 div DOM 참조

  useEffect(() => {
    initTmap();
  }, []);

  const initTmap = async () => {
    // 0. 기본 중심 좌표 (// 실패 시 centerLat, centerLon은 기본값 유지)
    let map;
    let centerLat = 37.504198; // 역삼역 위도
    let centerLon = 127.04894; // 역삼역 경도

    // 1. 현재 위치 얻기
    try {
      const currentLocation = await getCurrentLocation();
      centerLat = currentLocation.lat;
      centerLon = currentLocation.lon;
    } catch (err) {
      console.warn("위치 기본값 사용:", err);
    }
    // 2. 지도 생성
    map = new window.Tmapv2.Map(mapRef.current, {
      center: new window.Tmapv2.LatLng(centerLat, centerLon),
      width: "100%",
      height: "100vh", // ✅ 화면 전체 높이
      zoom: 16,
    });
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
