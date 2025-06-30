import React, { useEffect, useRef, useState } from "react";
import haversineDistance from "../utils/haversineUtil";
import { useLocation } from "react-router-dom";
import "./RecomendRoute.css";

export default function RecommendRoute() {
  const mapRef = useRef(null);
  const [searchOption, setSearchOption] = useState("0");
  const [routeResult, setRouteResult] = useState("");
  const [drawnPolylines, setDrawnPolylines] = useState([]);
  const [waypointMarkers, setWaypointMarkers] = useState([]);
  const [waypointsLatLng, setWaypointsLatLng] = useState([]);
  const [stationMarkers, setStationMarkers] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState("speed"); // ✅ 기본값 설정
  const [showSettings, setShowSettings] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState({
    level: 20,
    capacity: 70,
    efficiency: 5.0,
    temperature: 26,
  });
  const location = useLocation();
  const {
    originInput,
    destInput,
    originCoords = {},
    destCoords = {},
    filterOptions = {
      freeParking: false,
      noLimit: false,
      outputMin: 0,
      outputMax: 350,
      type: [],
      provider: [],
    },
  } = location.state || {};

  const [filters, setFilters] = useState(filterOptions);
  // const startLat = 37.504198,
  //   startLon = 127.04894;
  // const endLat = 35.1631,
  //   endLon = 129.1635;
  const startLat = originCoords.lat ?? 37.504198;
  const startLon = originCoords.lon ?? 127.04894;
  const endLat = destCoords.lat ?? 35.1631;
  const endLon = destCoords.lon ?? 129.1635;

  const { freeParking, noLimit, outputMin, outputMax, type, provider } =
    filterOptions;

  const [selectedStationIdx, setSelectedStationIdx] = useState(0);

  // 예시 데이터
  const stationCards = [
    {
      name: "역삼역 충전소",
      totalTime: "2시간 10분",
      detour: "5분",
      available: 3,
      total: 6,
    },
    {
      name: "강남역 충전소",
      totalTime: "2시간 15분",
      detour: "7분",
      available: 2,
      total: 4,
    },
    {
      name: "서초역 충전소",
      totalTime: "2시간 20분",
      detour: "10분",
      available: 1,
      total: 3,
    },
    {
      name: "양재역 충전소",
      totalTime: "2시간 25분",
      detour: "12분",
      available: 4,
      total: 5,
    },
    {
      name: "삼성역 충전소",
      totalTime: "2시간 30분",
      detour: "15분",
      available: 0,
      total: 2,
    },
  ];

  const routeOptions = [
    { value: "0", label: "차지추천" },
    { value: "1", label: "무료우선" },
    { value: "2", label: "최소시간" },
    { value: "4", label: "고속도로우선" },
    { value: "10", label: "최단거리" },
  ];

  useEffect(() => {
    const map = new Tmapv2.Map("map_div", {
      center: new Tmapv2.LatLng(startLat, startLon),
      width: "100%",
      height: "700px",
      zoom: 16,
    });
    mapRef.current = map;

    new Tmapv2.Marker({
      position: new Tmapv2.LatLng(startLat, startLon),
      icon: "/img/myLocationIcon/currentLocation.png",
      iconSize: new window.Tmapv2.Size(48, 72),
      map,
    });
    new Tmapv2.Marker({
      position: new Tmapv2.LatLng(endLat, endLon),
      icon: "/img/myLocationIcon/currentLocation.png",
      iconSize: new window.Tmapv2.Size(48, 72),
      map,
    });
  }, []);

  const resetMap = () => {
    drawnPolylines.forEach((polyline) => polyline.setMap(null));
    setDrawnPolylines([]);
    waypointMarkers.forEach((marker) => marker.setMap(null)); // ←마커 테스트 추가
    setWaypointMarkers([]); // <- 마커 테스트 추가
    setWaypointsLatLng([]); // <- 웨이포인트 위경도 리스트 초기화
    setRouteResult("");
  };

  const drawLineSegment = (map, path, color) => {
    const polyline = new Tmapv2.Polyline({
      path: path,
      strokeColor: color,
      strokeWeight: 6,
      map: map,
    });
    setDrawnPolylines((prev) => [...prev, polyline]);
  };

  const drawRouteLine = (map, arrPoint, traffic) => {
    if (!traffic || traffic.length === 0) {
      drawLineSegment(map, arrPoint, "#06050D");
      return;
    }

    const trafficColors = [
      "#06050D",
      "#61AB25",
      "#FFFF00",
      "#E87506",
      "#D61125",
    ];
    let tInfo = traffic.map(([start, end, index]) => ({
      startIndex: start,
      endIndex: end,
      trafficIndex: index,
    }));

    if (tInfo[0].startIndex > 0) {
      drawLineSegment(map, arrPoint.slice(0, tInfo[0].startIndex), "#06050D");
    }

    tInfo.forEach((info) => {
      const section = arrPoint.slice(info.startIndex, info.endIndex + 1);
      const color = trafficColors[info.trafficIndex] || "#06050D";
      drawLineSegment(map, section, color);
    });
  };

  // ******************************************************
  // 경로에 맞는 추천소 추천 시작
  // ******************************************************
  const requestRoute = async () => {
    // 1. 맵 초기화
    resetMap();
    // 2. selectedPriority 최신 값 반영
    const payload = {
      freeParking: filterOptions.freeParking,
      noLimit: filterOptions.noLimit,
      outputMin: filterOptions.outputMin,
      outputMax: filterOptions.outputMax,
      type: filterOptions.type,
      provider: filterOptions.provider,
      priority: selectedPriority, // 👈 사용자가 선택한 우선순위
    };

    // 3. tmap 경로안내 api 호출
    const res = await fetch(
      "https://apis.openapi.sk.com/tmap/routes?version=1&format=json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          appKey: "rzCNpiuhIX5l0dwT9rvQ93GRc22mFn6baRSvJYFl",
        },
        body: new URLSearchParams({
          startX: startLon,
          startY: startLat,
          endX: endLon,
          endY: endLat,
          reqCoordType: "WGS84GEO",
          resCoordType: "EPSG3857",
          searchOption,
          trafficInfo: "Y",
        }),
      }
    );

    const data = await res.json();
    const routeInfo = handleRouteResponse(data);
    if (!routeInfo) return; // 실패 방지

    const {
      highwayKm,
      cityKm,
      averageWeight,
      totalDistance,
      totalTime,
      totalFare,
    } = routeInfo;

    const {
      level: batteryLevelPercent,
      capacity: batteryCapacity,
      efficiency: baseEfficiency,
      temperature,
    } = batteryInfo;

    // 4. 웨이포인트 계산
    let accumulatedDistance = 0;
    const WAYPOINT_INTERVAL = 2000; // 웨이포인트 간격 10km: 10000
    let nextTarget = WAYPOINT_INTERVAL;
    let waypoints = [];
    let latlngList = [];

    for (let f of data.features) {
      if (f.geometry.type !== "LineString") continue;
      const coords = f.geometry.coordinates;

      for (let i = 0; i < coords.length - 1; i++) {
        const [x1, y1] = coords[i];
        const [x2, y2] = coords[i + 1];
        const pt1 = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
          new Tmapv2.Point(x1, y1)
        );
        const pt2 = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
          new Tmapv2.Point(x2, y2)
        );

        const segmentDistance = haversineDistance(
          pt1._lat,
          pt1._lng,
          pt2._lat,
          pt2._lng
        );

        let remaining = nextTarget - accumulatedDistance;
        while (remaining < segmentDistance) {
          const ratio = remaining / segmentDistance;
          const interpolatedX = x1 + (x2 - x1) * ratio;
          const interpolatedY = y1 + (y2 - y1) * ratio;
          waypoints.push([interpolatedX, interpolatedY]);

          // 웨이포인트 마커 추가
          // latlng : WGS84GEO 방식 위경도를 지닌 객체
          const latlng = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            new Tmapv2.Point(interpolatedX, interpolatedY)
          );
          //전역 변수로 WGS84GEO 좌표(latlng)들을 저장 -> 충전소 API용도
          latlngList.push({ lat: latlng._lat, lng: latlng._lng });

          // const marker = new Tmapv2.Marker({
          //   position: new Tmapv2.LatLng(latlng._lat, latlng._lng),
          //   map: mapRef.current,
          //   icon: "/img/pointer/redMarker.png",
          //   iconSize: new Tmapv2.Size(24, 24),
          // });
          // setWaypointMarkers((prev) => [...prev, marker]);
          // 마커 추가 끝

          nextTarget += WAYPOINT_INTERVAL; // 웨이포인트 간격
          remaining = nextTarget - accumulatedDistance;
        }

        accumulatedDistance += segmentDistance;
      }
    }
    //최종 웨이포인트 계산이 끝난 후 저장
    const hasHighway = routeInfo.highwayKm > 0; // 고속도로 여부 추가

    setWaypointsLatLng(latlngList);

    console.log("위경도 웨이포인트 리스트:", latlngList);

    // 5. 충전소 호출 전에 주행 가능 거리 계산
    const tempFactor = temperature <= -10 ? 0.8 : 1.0;
    const roadFactor = routeInfo.averageWeight || 1.0;
    const reachableDistance =
      (batteryLevelPercent / 100) *
      batteryCapacity *
      baseEfficiency *
      tempFactor *
      roadFactor;

    console.log(
      "🧮 계산된 주행 가능 거리:",
      reachableDistance.toFixed(1),
      "km (온도계수:",
      tempFactor,
      "도로계수:",
      roadFactor,
      ")"
    );

    // 6.reachableDistance 안에 속하는 웨이포인트에서만 충전소 호출
    const reachableCount = Math.floor(
      (reachableDistance * 1000) / WAYPOINT_INTERVAL
    );
    const includedList = latlngList.slice(0, reachableCount);

    console.log("🧮 예상 주행 가능 거리:", reachableDistance.toFixed(1), "km");
    console.log("🚩 포함된 웨이포인트 수:", includedList.length, "개");

    // 7. 웨이포인트 근처 충전소 호출& 반경기반 필터링
    handleFindNearbyStations(includedList, hasHighway, payload);
  };

  // ******************************************************
  // 경로에 맞는 추천소 끝!!!!
  // ******************************************************

  const handleRouteResponse = (response) => {
    const resultData = response.features;
    if (!resultData) return;

    let highwayDistance = 0,
      cityDistance = 0;
    resultData.forEach(({ geometry, properties }) => {
      if (geometry.type === "LineString") {
        const dist = properties.distance || 0;
        properties.roadType === 0
          ? (highwayDistance += dist)
          : (cityDistance += dist);
        const coords = geometry.coordinates.map(([x, y]) =>
          Tmapv2.Projection.convertEPSG3857ToWGS84GEO(new Tmapv2.Point(x, y))
        );
        drawRouteLine(mapRef.current, coords, geometry.traffic);
      }
    });

    const HIGHWAY_WEIGHT = 0.9;
    const CITY_WEIGHT = 1.1;
    const highwayKm = highwayDistance / 1000;
    const cityKm = cityDistance / 1000;
    const totalKm = highwayKm + cityKm;
    const averageWeight =
      totalKm > 0
        ? (highwayKm / totalKm) * HIGHWAY_WEIGHT +
          (cityKm / totalKm) * CITY_WEIGHT
        : 1.0;

    const props = resultData[0].properties;
    let resultText = `총 거리 : ${(props.totalDistance / 1000).toFixed(1)}km`;
    resultText += `, 총 시간 : ${(props.totalTime / 60).toFixed(0)}분`;
    resultText += `, 총 요금 : ${props.totalFare.toLocaleString()}원`;
    resultText += `<br> 고속도로 거리: ${highwayKm.toFixed(1)}km`;
    resultText += `<br> 도심 거리: ${cityKm.toFixed(1)}km`;
    resultText += `<br> 도로 유형별 평균 전비 가중치: ${averageWeight.toFixed(
      3
    )}`;
    setRouteResult(resultText);

    return {
      highwayKm,
      cityKm,
      averageWeight,
      totalDistance: props.totalDistance,
      totalTime: props.totalTime,
      totalFare: props.totalFare,
    };
  };

  //웨이포인트 리스트 기반 충전소 필터링 함수
  const handleFindNearbyStations = async (latlngList, hasHighway, payload) => {
    // 기존 추천 마커 제거
    stationMarkers.forEach((marker) => marker.setMap(null));
    setStationMarkers([]);

    const res = await fetch("/api/station/getStationsNearWaypoints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        waypoints: latlngList,
        highway: hasHighway,
        ...payload, // ✅ 전개 연산자로 편입
      }),
    });

    const data = await res.json();
    console.log("📍 최종 충전소 목록:", data);

    const newMarkers = data.map((station) => {
      const marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(station.lat, station.lng),
        icon: "/img/logos/default.png",
        iconSize: new Tmapv2.Size(32, 32),
        title: station.statNm,
        map: mapRef.current,
      });

      return marker;
    });
    setStationMarkers(newMarkers);
  };

  // 핸들러 예시
  function handleBack() {}
  function handleSwap() {}
  function handleAddWaypoint() {}

// 네비 연결
   const openTmapApp = () => {
    const viaParams = (waypointsLatLng || []) 
      .map((v, i) => {
        const name = v.name ?? `WP${i + 1}`;
        return `viaName${i + 1}=${encodeURIComponent(name)}&viaX${i + 1}=${v.lon}&viaY${i + 1}=${v.lat}`;
      })
      .join("&");

    const appURL = `tmap://route?startx=${startLon}&starty=${startLat}&goalx=${endLon}&goaly=${endLat}&startname=출발지&goalname=도착지${viaParams ? `&${viaParams}` : ""}&appKey=vlxDMNvK4Q3NY3i9Rm7e24E2twBIgIeT7H6nOHQE`;
    const fallbackURL = "https://play.google.com/store/apps/details?id=com.skt.tmap.ku"; // Tmap 설치 링크

const now = new Date().getTime();
window.location.href = appURL;

// 일정 시간 후 fallback (앱이 실행 안 되면 그대로 머무름 → fallback 이동)
setTimeout(() => {
  if (new Date().getTime() - now < 2000) {
    window.location.href = fallbackURL;
  }
}, 1500);

    window.location.href = appURL;
  };

  return (
    <div className="recommend-route-root">
      {/* 상단 오버레이 */}
      <div className="route-top-overlay">
        <div className="route-inputs-wide">
          <div className="route-inputs-row">
            <button className="route-back-btn" onClick={handleBack}>
              &lt;
            </button>
            <input
              className="route-input"
              type="text"
              value={originInput || ""}
              placeholder="출발지 입력"
              readOnly
            />
            <button className="route-swap-btn" onClick={handleSwap}>
              ↕
            </button>
          </div>
          <div className="route-inputs-row">
            <span className="route-back-btn route-back-btn-placeholder"></span>
            <input
              className="route-input"
              type="text"
              value={destInput || ""}
              placeholder="도착지 입력"
              readOnly
            />
            <button
              className="route-addwaypoint-btn"
              onClick={handleAddWaypoint}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 경로추천 옵션 카드 슬라이드 - 오버레이 바깥, 지도 위에 */}
      <div className="route-option-slider-abs">
        <div className="route-option-slider">
          {routeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`route-option-card${
                searchOption === opt.value ? " selected" : ""
              }`}
              onClick={() => {
                setSearchOption(opt.value);
                requestRoute();
              }}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="route-settings-open-btn"
        aria-label="설정"
      >
        <span role="img" aria-label="설정">
          ⚙️
        </span>
      </button>

      {/* 설정 패널 바깥 클릭 시 닫히는 오버레이 */}
      {showSettings && (
        <div className="route-overlay" onClick={() => setShowSettings(false)} />
      )}

      {/* 슬라이드 패널 */}
      <div className={`route-slide-panel ${showSettings ? "open" : ""}`}>
        {/* 뒤로가기 버튼 */}
        <button
          className="route-slide-back-btn"
          onClick={() => setShowSettings(false)}
        >
          ←
        </button>
        <h3>🔋 배터리 정보 입력</h3>

        {/* 배터리 잔량 */}
        <div className="slider-group">
          <label>배터리 잔량</label>
          <div className="slider-value">{batteryInfo.level.toFixed(1)}%</div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={batteryInfo.level}
            onChange={(e) =>
              setBatteryInfo({ ...batteryInfo, level: Number(e.target.value) })
            }
            className="custom-slider"
          />
        </div>

        {/* 공인 전비 */}
        <div className="slider-group">
          <label>공인 전비</label>
          <div className="slider-value">
            {batteryInfo.efficiency.toFixed(1)} km/kWh
          </div>
          <input
            type="range"
            min={3}
            max={10}
            step={0.1}
            value={batteryInfo.efficiency}
            onChange={(e) =>
              setBatteryInfo({
                ...batteryInfo,
                efficiency: Number(e.target.value),
              })
            }
            className="custom-slider"
          />
        </div>

        {/* 선호 충전 한도 */}
        <div className="slider-group">
          <label>선호 충전 한도</label>
          <div className="slider-value">
            {batteryInfo.chargeLimit?.toFixed(1) ?? 85}%
          </div>
          <input
            type="range"
            min={60}
            max={100}
            step={0.1}
            value={batteryInfo.chargeLimit ?? 85}
            onChange={(e) =>
              setBatteryInfo({
                ...batteryInfo,
                chargeLimit: Number(e.target.value),
              })
            }
            className="custom-slider"
          />
        </div>

        {/* 희망 목적지 배터리 잔량 */}
        <div className="slider-group">
          <label>희망 목적지 배터리 잔량</label>
          <div className="slider-value">
            {batteryInfo.targetLevel?.toFixed(1) ?? 50}%
          </div>
          <input
            type="range"
            min={10}
            max={80}
            step={0.1}
            value={batteryInfo.targetLevel ?? 50}
            onChange={(e) =>
              setBatteryInfo({
                ...batteryInfo,
                targetLevel: Number(e.target.value),
              })
            }
            className="custom-slider"
          />
        </div>

        {/* 배터리 용량 */}
        <div className="slider-group">
          <label>배터리 용량</label>
          <div className="slider-value">{batteryInfo.capacity} kWh</div>
          <input
            type="range"
            min={20}
            max={120}
            step={1}
            value={batteryInfo.capacity}
            onChange={(e) =>
              setBatteryInfo({
                ...batteryInfo,
                capacity: Number(e.target.value),
              })
            }
            className="custom-slider"
          />
        </div>

        {/* 외부 온도 */}
        <div className="slider-group">
          <label>외부 온도</label>
          <div className="slider-value">{batteryInfo.temperature}℃</div>
          <input
            type="range"
            min={-20}
            max={50}
            step={1}
            value={batteryInfo.temperature}
            onChange={(e) =>
              setBatteryInfo({
                ...batteryInfo,
                temperature: Number(e.target.value),
              })
            }
            className="custom-slider"
          />
        </div>

        {/* 충전소 선호 선택 */}
        <div className="priority-select-group">
          <button
            className={`priority-btn ${
              selectedPriority === "speed" ? "selected" : ""
            }`}
            onClick={() => setSelectedPriority("speed")}
          >
            속도 중시
          </button>
          <button
            className={`priority-btn ${
              selectedPriority === "reliability" ? "selected" : ""
            }`}
            onClick={() => setSelectedPriority("reliability")}
          >
            신뢰성 중시
          </button>
          <button
            className={`priority-btn ${
              selectedPriority === "comfort" ? "selected" : ""
            }`}
            onClick={() => setSelectedPriority("comfort")}
          >
            편의성 중시
          </button>
        </div>

        {/* 설정 적용하기 버튼 */}
        <button
          className="apply-settings-btn"
          onClick={() => setShowSettings(false)}
        >
          설정 적용하기
        </button>
      </div>

      {/* 지도 */}
      <div id="map_div" className="route-map-div"></div>

      {/* 하단 카드 슬라이드 */}
      <div className="station-card-slider">
        <div className="station-card-list">
          {stationCards.map((card, idx) => (
            <div
              key={idx}
              className={`station-card${
                selectedStationIdx === idx ? " selected" : ""
              }`}
              onClick={() => setSelectedStationIdx(idx)}
            >
              <div className="station-card-title">{card.name}</div>
              <div className="station-card-info">
                <span>총 시간: {card.totalTime}</span>
                <span>우회: {card.detour}</span>
              </div>
              <div className="station-card-charger">
                사용가능 {card.available} / {card.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 네비연결(안내시작) 버튼 */}
      <button className="navi-start-btn" onClick={openTmapApp} >네비연결</button>
    </div>
  );
}
