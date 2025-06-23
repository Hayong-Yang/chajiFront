import React, { useEffect, useRef, useState } from "react";
import {
  setStationNear,
  getStationNear,
  registerMapCenterListener,
  trackUserMovement,
} from "../api/map";
import "./home.css";

// === 충전 속도 옵션 배열 ===
const outputOptions = [0, 50, 100, 150, 200, 250, 300, 350];

export default function Home() {
  // 전역 변수
  const mapRef = useRef(null); //  // 지도를 담을 div DOM 참조용
  const mapInstance = useRef(null); // 생성된 지도 객체(Tmapv2.Map)를 저장
  const userMarkerRef = useRef(null); // 사용자 위치 마커 객체
  const markersRef = useRef([]); // 마커들을 저장할 ref 배열
  // 기본 중심 좌표 (// 실패 시 centerLat, centerLon은 기본값 유지)
  const centerLatRef = useRef(37.504198); // 역삼역 위도
  const centerLonRef = useRef(127.04894); // 역삼역 경도
  // 충전소 상태 info 접근
  const [selectedStation, setSelectedStation] = useState(null); // ← 상태 추가

  // 충전기 타입 설명 리스트
  const chargerTypeOptions = [
    { code: "01", label: "DC 차데모" },
    { code: "02", label: "AC 완속" },
    { code: "03", label: "DC 차데모+AC3 상" },
    { code: "04", label: "DC 콤보" },
    { code: "05", label: "DC 차데모+DC 콤보" },
    { code: "06", label: "DC 차데모+AC3 상+DC 콤보" },
    { code: "07", label: "AC3 상" },
    { code: "08", label: "DC 콤보(완속)" },
    { code: "09", label: "NACS" },
    { code: "10", label: "DC 콤보+NACS" },
  ];

  const [showFilter, setShowFilter] = useState(false); // 필터 창 표시 여부
  const [filterOptions, setFilterOptions] = useState({
    freeParking: false,
    noLimit: false,
    outputMin: 0, // ★ 이상
    outputMax: 350, // ★ 이하
    type: chargerTypeOptions.map((option) => option.code), // 기본 모두 체크
    provider: "", // 예: "환경부"
  }); // 필터 옵션 상태

  const filterOptionsRef = useRef(filterOptions); // 최신 필터 상태 추적용

  // 앱 실행
  useEffect(() => {
    initTmap({ mapInstance, markersRef });
  }, []);

  useEffect(() => {
    filterOptionsRef.current = filterOptions; // filterOptions가 바뀔 때 최신값 저장
  }, [filterOptions]);

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
      height: "100vh", // 화면 전체 높이
      zoom: 16,
    });

    // 3. 최초 사용자 위치 마커 생성, 이동시 마커 움직임
    updateUserMarker(centerLatRef.current, centerLonRef.current);
    // 4. 프론트에서 현재 위치 전송 + 근처 충전소 세팅 함수
    await setStationNear(centerLatRef.current, centerLonRef.current);
    // 5. 저장 후 즉시 지도에 뿌리기 (추가)
    await getStationNear(
      centerLatRef.current,
      centerLonRef.current,
      mapInstance,
      markersRef,
      setSelectedStation,
      filterOptions // 필터 옵션 전달
    );

    console.log("전송할 필터옵션:", filterOptions);

    // 6. 이벤트 발생시마다 지도 중심 구하기(줌/드래그 후 서버 반영)
    registerMapCenterListener(
      mapInstance.current,
      setStationNear,
      getStationNear,
      mapInstance,
      markersRef,
      setSelectedStation,
      filterOptionsRef // 항상 최신값 유지되도록 ref 전달
    );
    // 7. 실시간으로 사용자 움직임 감지
    // + sendCenterToServer 해서 중심 위경도 전달, 충전소 호출
    trackUserMovement(
      mapInstance,
      userMarkerRef,
      setStationNear,
      getStationNear,
      markersRef,
      setSelectedStation,
      filterOptionsRef
    );
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

  // === 이상/이하 select 박스 핸들러 ===
  const handleOutputSelect = (e) => {
    const { name, value } = e.target;
    setFilterOptions((prev) => {
      let newState = { ...prev, [name]: Number(value) };
      // outputMin(이상) 이 outputMax(이하)보다 크면, 둘을 맞춰줌
      if (newState.outputMin > newState.outputMax) {
        if (name === "outputMin") newState.outputMax = newState.outputMin;
        else newState.outputMin = newState.outputMax;
      }
      return newState;
    });
  };

  // 필터 설정 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === "type") {
      setFilterOptions((prev) => {
        const currentTypes = new Set(prev.type);
        if (checked) currentTypes.add(value);
        else currentTypes.delete(value);
        return { ...prev, type: Array.from(currentTypes) };
      });
    } else {
      setFilterOptions((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // 필터 적용 버튼 클릭 시
  const applyFilters = async () => {
    await setStationNear(centerLatRef.current, centerLonRef.current);
    await getStationNear(
      centerLatRef.current,
      centerLonRef.current,
      mapInstance,
      markersRef,
      setSelectedStation,
      filterOptions
    );
    setShowFilter(false);
  };

  // === 선택 구간 텍스트 표시 ===
  const outputText =
    filterOptions.outputMin === 0 && filterOptions.outputMax === 350
      ? "전체"
      : `${filterOptions.outputMin}kW 이상 ~ ${filterOptions.outputMax}kW 이하`;

  // === filter-panel 스타일 추가/수정 (★)
  const filterPanelStyle = {
    borderRadius: 14,
    padding: "18px 16px 12px 16px",
    background: "#fff",
    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
    minWidth: 320,
    maxWidth: 400,
    zIndex: 99,
    fontSize: 15,
    fontWeight: 400,
    position: "absolute",
    top: 22,
    left: 12,
  };

  // 화면 부분
  return (
    <div>
      {/* <h2>전기차 충전소 홈 </h2> */}
      <div id="map_div" ref={mapRef} className="map-container"></div>

      {/* 필터 아이콘 및 창 */}
      <button
        onClick={() => setShowFilter((prev) => !prev)}
        className="filter-button"
      >
        🔍 필터
      </button>

      {showFilter && (
        <div className="filter-panel">
          <h4>충전소 필터</h4>
          <label>
            <input
              type="checkbox"
              name="freeParking"
              checked={filterOptions.freeParking}
              onChange={handleFilterChange}
            />
            무료 주차만 보기
          </label>
          <label>
            <input
              type="checkbox"
              name="noLimit"
              checked={filterOptions.noLimit}
              onChange={handleFilterChange}
            />
            이용제한 없는 곳만 보기
          </label>

          {/* === 충전 속도 '이상/이하' 셀렉트 === */}
          <div style={{ margin: "10px 0 0", fontWeight: 600, fontSize: 16 }}>
            충전속도
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "10px 0 0",
              flexWrap: "wrap",
            }}
          >
            <select
              name="outputMin"
              value={filterOptions.outputMin}
              onChange={handleOutputSelect}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 16,
                marginRight: 2,
                minWidth: 70,
              }}
            >
              {outputOptions.map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? "완속" : `${v}kW`}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 15, fontWeight: 500 }}>이상</span>
            <select
              name="outputMax"
              value={filterOptions.outputMax}
              onChange={handleOutputSelect}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 16,
                marginLeft: 8,
                minWidth: 70,
              }}
            >
              {outputOptions.map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? "완속" : `${v}kW`}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 15, fontWeight: 500 }}>이하</span>
          </div>
          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginTop: 7,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                color: "#31ba81",
                background: "#ecfaf3",
                fontWeight: 600,
                fontSize: 14,
                padding: "4px 10px",
                borderRadius: 12,
                display: "inline-block",
                letterSpacing: 0.5,
              }}
            >
              {outputText}
            </span>
          </div>

          <fieldset>
            <legend>충전기 타입:</legend>
            {chargerTypeOptions.map((option) => (
              <label key={option.code}>
                <input
                  type="checkbox"
                  name="type"
                  value={option.code}
                  checked={filterOptions.type.includes(option.code)}
                  onChange={handleFilterChange}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <label>
            사업자:
            <input
              type="text"
              name="provider"
              value={filterOptions.provider}
              onChange={handleFilterChange}
              placeholder="예: 환경부"
            />
          </label>
          <button onClick={applyFilters}>필터 적용</button>
        </div>
      )}

      <div className={`station-info-panel ${selectedStation ? "visible" : ""}`}>
        {selectedStation && (
          <>
            <p>{selectedStation.statNm}</p>
            <p>{selectedStation.bnm}</p>
            <p>{selectedStation.addr}</p>
            <p>{selectedStation.statId}</p>
            <p>{selectedStation.chgerId}</p>
            <button onClick={() => setSelectedStation(null)}>닫기</button>
          </>
        )}
      </div>
    </div>
  );
}
