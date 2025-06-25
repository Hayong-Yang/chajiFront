import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAutocomplete, normalizeCoords, getStationMeta } from "../api/poi";
import axios from "axios";

import {
  setStationNear,
  getStationNear,
  registerMapCenterListener,
  trackUserMovement,
} from "../api/map";
import "./home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

// === 충전 속도 옵션 배열 ===
const outputOptions = [0, 50, 100, 150, 200, 250, 300, 350];

// === 충전사업자 옵션 배열 ===  // 수정: providerOptions 추가
const providerOptions = [
  { code: "AC", label: "아우토크립트" },
  { code: "AH", label: "아하" },
  { code: "AL", label: "아론" },
  { code: "AM", label: "아마노코리아" },
  { code: "AP", label: "애플망고" },
  { code: "BA", label: "부안군" },
  { code: "BE", label: "브라이트에너지파트너스" },
  { code: "BG", label: "비긴스" },
  { code: "BK", label: "비케이에너지" },
  { code: "BN", label: "블루네트웍스" },
  { code: "BP", label: "차밥스" },
  { code: "BS", label: "보스시큐리티" },
  { code: "BT", label: "보타리에너지" },
  { code: "CA", label: "씨에스테크놀로지" },
  { code: "CB", label: "참빛이브이씨" },
  { code: "CC", label: "코콤" },
  { code: "CG", label: "서울씨엔지" },
  { code: "CH", label: "채움모빌리티" },
  { code: "CI", label: "쿨사인" },
  { code: "CN", label: "에바씨엔피" },
  { code: "CO", label: "한전케이디엔" },
  { code: "CP", label: "캐스트프로" },
  { code: "CR", label: "크로커스" },
  { code: "CS", label: "한국EV충전서비스센터" },
  { code: "CT", label: "씨티카" },
  { code: "CU", label: "씨어스" },
  { code: "CV", label: "채비" },
  { code: "DE", label: "대구공공시설관리공단" },
  { code: "DG", label: "대구시" },
  { code: "DL", label: "딜라이브" },
  { code: "DO", label: "대한송유관공사" },
  { code: "DP", label: "대유플러스" },
  { code: "DR", label: "두루스코이브이" },
  { code: "DS", label: "대선" },
  { code: "DY", label: "동양이엔피" },
  { code: "E0", label: "에너지플러스" },
  { code: "EA", label: "에바" },
  { code: "EB", label: "일렉트리" },
  { code: "EC", label: "이지차저" },
  { code: "EE", label: "이마트" },
  { code: "EG", label: "에너지파트너즈" },
  { code: "EH", label: "이앤에이치에너지" },
  { code: "EK", label: "이노케이텍" },
  { code: "EL", label: "엔라이튼" },
  { code: "EM", label: "evmost" },
  { code: "EN", label: "이엔" },
  { code: "EO", label: "E1" },
  { code: "EP", label: "이카플러그" },
  { code: "ER", label: "이엘일렉트릭" },
  { code: "ES", label: "이테스" },
  { code: "ET", label: "이씨티" },
  { code: "EV", label: "에버온" },
  { code: "EZ", label: "차지인" },
  { code: "FE", label: "에프이씨" },
  { code: "FT", label: "포티투닷" },
  { code: "G1", label: "광주시" },
  { code: "G2", label: "광주시" },
  { code: "GD", label: "그린도트" },
  { code: "GE", label: "그린전력" },
  { code: "GG", label: "강진군" },
  { code: "GN", label: "지에스커넥트" },
  { code: "GO", label: "유한회사 골드에너지" },
  { code: "GP", label: "군포시" },
  { code: "GR", label: "그리드위즈" },
  { code: "GS", label: "GS칼텍스" },
  { code: "HB", label: "에이치엘비생명과학" },
  { code: "HD", label: "현대자동차" },
  { code: "HE", label: "한국전기차충전서비스" },
  { code: "HL", label: "에이치엘비일렉" },
  { code: "HM", label: "휴맥스이브이" },
  { code: "HP", label: "해피차지" },
  { code: "HR", label: "한국홈충전" },
  { code: "HS", label: "홈앤서비스" },
  { code: "HW", label: "한화솔루션" },
  { code: "HY", label: "현대엔지니어링" },
  { code: "IC", label: "인천국제공항공사" },
  { code: "IK", label: "익산시" },
  { code: "IM", label: "아이마켓코리아" },
  { code: "IN", label: "신세계아이앤씨" },
  { code: "IO", label: "아이온커뮤니케이션즈" },
  { code: "IV", label: "인큐버스" },
  { code: "JA", label: "이브이시스" },
  { code: "JC", label: "제주에너지공사" },
  { code: "JD", label: "제주도청" },
  { code: "JE", label: "제주전기자동차서비스" },
  { code: "JH", label: "종하아이앤씨" },
  { code: "JJ", label: "전주시" },
  { code: "JN", label: "제이앤씨플랜" },
  { code: "JT", label: "제주테크노파크" },
  { code: "JU", label: "정읍시" },
  { code: "KA", label: "기아자동차" },
  { code: "KC", label: "한국컴퓨터" },
  { code: "KE", label: "한국전기차인프라기술" },
  { code: "KG", label: "KH에너지" },
  { code: "KH", label: "김해시" },
  { code: "KI", label: "기아자동차" },
  { code: "KJ", label: "순천시" },
  { code: "KL", label: "클린일렉스" },
  { code: "KM", label: "카카오모빌리티" },
  { code: "KN", label: "한국환경공단" },
  { code: "KO", label: "이브이파트너스" },
  { code: "KP", label: "한국전력" },
  { code: "KR", label: "이브이씨코리아" },
  { code: "KS", label: "한국전기차솔루션" },
  { code: "KT", label: "케이티" },
  { code: "KU", label: "한국충전연합" },
  { code: "L3", label: "엘쓰리일렉트릭파워" },
  { code: "LC", label: "롯데건설" },
  { code: "LD", label: "롯데이노베이트" },
  { code: "LH", label: "LG유플러스 볼트업(플러그인)" },
  { code: "LI", label: "엘에스이링크" },
  { code: "LT", label: "광성계측기" },
  { code: "LU", label: "LG유플러스 볼트업" },
  { code: "MA", label: "맥플러스" },
  { code: "ME", label: "환경부" },
  { code: "MO", label: "매니지온" },
  { code: "MR", label: "미래씨앤엘" },
  { code: "MS", label: "미래에스디" },
  { code: "MT", label: "모던텍" },
  { code: "MV", label: "메가볼트" },
  { code: "NB", label: "엔비플러스" },
  { code: "NE", label: "에너넷" },
  { code: "NH", label: "농협경제지주 신재생에너지센터" },
  { code: "NJ", label: "나주시" },
  { code: "NN", label: "이브이네스트" },
  { code: "NS", label: "뉴텍솔루션" },
  { code: "NT", label: "한국전자금융" },
  { code: "NX", label: "넥씽" },
  { code: "OB", label: "현대오일뱅크" },
  { code: "PA", label: "이브이페이" },
  { code: "PC", label: "파킹클라우드" },
  { code: "PE", label: "피앤이시스템즈" },
  { code: "PI", label: "GS차지비" },
  { code: "PK", label: "펌프킨" },
  { code: "PL", label: "플러그링크" },
  { code: "PM", label: "피라인모터스" },
  { code: "PS", label: "이브이파킹서비스" },
  { code: "PW", label: "파워큐브" },
  { code: "RE", label: "레드이엔지" },
  { code: "RS", label: "리셀파워" },
  { code: "S1", label: "에스이피" },
  { code: "SA", label: "설악에너텍" },
  { code: "SB", label: "소프트베리" },
  { code: "SC", label: "삼척시" },
  { code: "SD", label: "스칼라데이터" },
  { code: "SE", label: "서울시" },
  { code: "SF", label: "스타코프" },
  { code: "SG", label: "SK시그넷" },
  { code: "SH", label: "에스에이치에너지" },
  { code: "SJ", label: "세종시" },
  { code: "SK", label: "SK에너지" },
  { code: "SL", label: "에스에스기전" },
  { code: "SM", label: "성민기업" },
  { code: "SN", label: "서울에너지공사" },
  { code: "SO", label: "선광시스템" },
  { code: "SP", label: "스마트포트테크놀로지" },
  { code: "SR", label: "SK렌터카" },
  { code: "SS", label: "투이스이브이씨" },
  { code: "ST", label: "SK일렉링크" },
  { code: "SU", label: "순천시 체육시설관리소" },
  { code: "SZ", label: "SG생활안전" },
  { code: "TB", label: "태백시" },
  { code: "TD", label: "타디스테크놀로지" },
  { code: "TE", label: "테슬라" },
  { code: "TH", label: "태현교통" },
  { code: "TL", label: "티엘컴퍼니" },
  { code: "TM", label: "티맵" },
  { code: "TR", label: "한마음장애인복지회" },
  { code: "TS", label: "태성콘텍" },
  { code: "TU", label: "티비유" },
  { code: "TV", label: "아이토브" },
  { code: "UN", label: "유니이브이" },
  { code: "UP", label: "유플러스아이티" },
  { code: "US", label: "울산시" },
  { code: "VT", label: "볼타" },
  { code: "WB", label: "이브이루씨" },
  { code: "YC", label: "노란충전" },
  { code: "YY", label: "양양군" },
  { code: "ZE", label: "이브이모드코리아" },
].sort((a, b) => a.label.localeCompare(b.label, "ko"));

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

// === 리스트보기 전용 서버 호출 함수 ===
async function fetchStationList(filterOptions, lat, lon) {
  try {
    const resp = await axios.post("/api/station/getStationNear", {
      lat,
      lon,
      freeParking: filterOptions.freeParking,
      noLimit: filterOptions.noLimit,
      outputMin: filterOptions.outputMin,
      outputMax: filterOptions.outputMax,
      type: filterOptions.type,
      provider: filterOptions.provider,
    });
    return resp.data; // 수정: JSON 파싱된 배열 반환
  } catch (e) {
    console.error("리스트보기 호출 실패", e); // 수정: 에러 로깅
    return [];
  }
}

// =============================
// 🔹 자동완성 입력 컴포넌트
// =============================
function AutocompleteInput({ label, value = "", onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);

  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const v = (value || "").trim();
    if (v.length < 2) {
      setSuggestions([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      const data = await fetchAutocomplete(value.trim());
      console.log("자동완성 결과:", data);
      setSuggestions(data);
      setShowList(true);
    }, 300);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <label className="autocomplete-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${label} 입력`}
        autoComplete="off"
        onFocus={() => {
          if (suggestions.length > 0) setShowList(true);
        }}
        className="autocomplete-input"
      />
      {showList && suggestions.length > 0 && (
        <ul className="autocomplete-list">
          {suggestions.map((item) => (
            <li
              key={`${item.name}-${item.lat}-${item.lon}`}
              onClick={() => {
                onSelect(item);
                setShowList(false);
              }}
              className="autocomplete-item"
            >
              <strong>{item.name}</strong>
              <br />
              <small>{item.address}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  // 상태 추가: 리스트 보기 상태 및 충전소 리스트
  const [stations, setStations] = useState([]); // 충전소 리스트
  const [showList, setShowList] = useState(false); // 리스트 뷰 토글
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeMenu, setActiveMenu] = useState("home"); // 선택된 메뉴

  // 전역 변수
  const [mode, setMode] = useState("search"); //검색창 구분
  const [searchInput, setSearchInput] = useState(""); //검색창 모드
  const centerMarkerRef = useRef(null); // ← 추가: 이동 중심 마커
  const originMarkerRef = useRef(null); // 출발지 마커
  const destMarkerRef = useRef(null); // 도착지 마커
  const originIconUrl = "/img/logos/start.png";
  const destIconUrl = "/img/logos/end.png";
  const defaultIconUrl = "/img/logos/default.png";
  const mapRef = useRef(null); //  // 지도를 담을 div DOM 참조용
  const mapInstance = useRef(null); // 생성된 지도 객체(Tmapv2.Map)를 저장
  const userMarkerRef = useRef(null); // 사용자 위치 마커 객체
  const markersRef = useRef([]); // 마커들을 저장할 ref 배열
  // 기본 중심 좌표 (// 실패 시 centerLat, centerLon은 기본값 유지)
  const centerLatRef = useRef(37.504198); // 역삼역 위도
  const centerLonRef = useRef(127.04894); // 역삼역 경도
  const [originInput, setOriginInput] = useState(""); //출발지 입력값
  const [destInput, setDestInput] = useState(""); //도착지 입력값
  const [selectedDestStation, setSelectedDestStation] = useState(null);
  const [selectedOriginStation, setSelectedOriginStation] = useState(null);

  // 충전소 상태 info 접근s
  const [selectedStation, setSelectedStation] = useState(null); // ← 상태 추가

  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  };

  const [filterOptions, setFilterOptions] = useState({
    freeParking: false,
    noLimit: false,
    outputMin: 0, // 이상
    outputMax: 350, // 이하
    type: chargerTypeOptions.map((option) => option.code), // 기본 모두 체크
    provider: providerOptions.map((o) => o.code),
  }); // 필터 옵션 상태

  const filterOptionsRef = useRef(filterOptions); // 최신 필터 상태 추적용
  const drawerRef = useRef(null); // 사이드 드로어 영역 참조

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setShowDrawer(false);
      }
    };
    if (showDrawer) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDrawer]);

  const handleSearchSelect = (item, source = "search") => {
    const map = mapInstance.current;
    if (!map) return;

    const coords = normalizeCoords(item);
    const meta = getStationMeta(coords);
    const position = new window.Tmapv2.LatLng(meta.lat, meta.lon);

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
    }

    const marker = new window.Tmapv2.Marker({
      position,
      map,
      icon: "/img/myLocationIcon/currentLocation.png",
      iconSize: new window.Tmapv2.Size(48, 72),
    });
    marker.dataStatId = meta.statId;
    marker.originalIcon = marker.getIcon();
    centerMarkerRef.current = marker;

    marker.addListener("click", () => {
      setSelectedStation(meta);
    });

    markersRef.current.push({ data: meta, marker });
    setSelectedStation(meta);
    map.setCenter(position);
    map.setZoom(15);

    if (source === "origin") {
      setOriginInput(meta.statNm);
      setSelectedOriginStation(meta);
    } else if (source === "dest") {
      setDestInput(meta.statNm);
      setSelectedDestStation(meta);
    }
  };

  const navigate = useNavigate();

  // 앱 실행
  useEffect(() => {
    initTmap({ mapInstance, markersRef });
  }, []);

  useEffect(() => {
    filterOptionsRef.current = filterOptions; // filterOptions가 바뀔 때 최신값 저장
  }, [filterOptions]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("showList") === "true") {
      handleShowList(); // 리스트 자동 표시
    }
  }, []);

  // 리스트보기 핸들러
  const handleShowList = async () => {
    if (showList) {
      setShowList(false); // 이미 열려있으면 닫기
      return;
    }

    await setStationNear(centerLatRef.current, centerLonRef.current);
    const list = await fetchStationList(
      filterOptions,
      centerLatRef.current,
      centerLonRef.current
    );
    setStations(list);
    setShowList(true);
  };

  // === inline 필터 적용 함수 ===
  const applyFiltersInline = async (options) => {
    await setStationNear(centerLatRef.current, centerLonRef.current);
    await getStationNear(
      centerLatRef.current,
      centerLonRef.current,
      mapInstance,
      markersRef,
      setSelectedStation,
      options
    );
  };

  // 속도 선택 시 필터 즉시 적용
  const handleSpeedChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions((prev) => {
      const next = { ...prev, [name]: Number(value) };
      if (next.outputMin > next.outputMax) {
        if (name === "outputMin") next.outputMax = next.outputMin;
        else next.outputMin = next.outputMax;
      }
      applyFiltersInline(next);
      return next;
    });
  };

  // 타입 체크박스 선택 시 필터 즉시 적용
  const handleInlineTypeChange = (e) => {
    const { checked, value } = e.target;
    setFilterOptions((prev) => {
      const setCodes = new Set(prev.type);
      if (checked) setCodes.add(value);
      else setCodes.delete(value);
      const next = { ...prev, type: Array.from(setCodes) };
      applyFiltersInline(next);
      return next;
    });
  };

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
      filterOptionsRef, // 필터 옵션 전달
      originMarkerRef,
      destMarkerRef
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
      filterOptionsRef, // 항상 최신값 유지되도록 ref 전달
      originMarkerRef, // 추가
      destMarkerRef
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
      filterOptionsRef,
      originMarkerRef,
      destMarkerRef
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
      console.log("🎯 사용자 마커 새로 생성");
      userMarkerRef.current = new window.Tmapv2.Marker({
        position,
        icon: "/img/myLocationIcon/currentLocation.png",
        iconSize: new window.Tmapv2.Size(48, 72),
        map,
      });
    } else {
      console.log("✅ 사용자 마커 이동");
      userMarkerRef.current.setPosition(position);
    }
  };
  const handleOriginSelect = (item) => {
    const meta = getStationMeta(normalizeCoords(item));
    setOriginInput(meta.statNm);
    const map = mapInstance.current;

    if (map) {
      const position = new window.Tmapv2.LatLng(meta.lat, meta.lon);
      map.setCenter(position);
      map.setZoom(15);
      // setOrigin(meta); // 필요 시 위치 상태 저장
    }
  };
  const handleDestSelect = (item) => {
    const meta = getStationMeta(normalizeCoords(item));
    setDestInput(meta.statNm);

    const map = mapInstance.current;
    if (map) {
      const position = new window.Tmapv2.LatLng(meta.lat, meta.lon);
      map.setCenter(position);
      map.setZoom(15);
    }
    // setDest(meta); // 필요 시 위치 상태 저장
  };

  // 스왑함수
  const handleSwap = () => {
    if (!originMarkerRef.current || !destMarkerRef.current) return;

    const map = mapInstance.current;

    // 1. 위치 & statId 백업
    const originPos = originMarkerRef.current.getPosition();
    const destPos = destMarkerRef.current.getPosition();
    const originStatId = originMarkerRef.current.dataStatId;
    const destStatId = destMarkerRef.current.dataStatId;

    // 2. 기존 마커 제거
    originMarkerRef.current.setMap(null);
    destMarkerRef.current.setMap(null);

    // 3. 새 마커 생성
    const newOriginMarker = new window.Tmapv2.Marker({
      position: destPos,
      map,
      icon: "/img/logos/start.png",
      iconSize: new window.Tmapv2.Size(36, 54),
      iconAnchor: new window.Tmapv2.Point(18, 54),
    });
    newOriginMarker.dataStatId = destStatId;

    const newDestMarker = new window.Tmapv2.Marker({
      position: originPos,
      map,
      icon: "/img/logos/end.png",
      iconSize: new window.Tmapv2.Size(36, 54),
      iconAnchor: new window.Tmapv2.Point(18, 54),
    });
    newDestMarker.dataStatId = originStatId;

    // 4. 클릭 이벤트 부여
    newOriginMarker.addListener("click", () => {
      map.setCenter(newOriginMarker.getPosition());
    });
    newDestMarker.addListener("click", () => {
      map.setCenter(newDestMarker.getPosition());
    });

    // 5. 레퍼런스 교체
    originMarkerRef.current = newOriginMarker;
    destMarkerRef.current = newDestMarker;

    // 6. 입력창 스왑
    const tempInput = originInput;
    setOriginInput(destInput);
    setDestInput(tempInput);
  };

  // ** 패널 버튼 함수 **
  const handleSetOrigin = () => {
    if (!selectedStation || !mapInstance.current) return;

    const position = new window.Tmapv2.LatLng(
      selectedStation.lat,
      selectedStation.lon
    );

    // === 이전 출발지 마커 복원 ===
    if (originMarkerRef.current) {
      if (originMarkerRef.current.originalIcon) {
        originMarkerRef.current.setIcon(originMarkerRef.current.originalIcon);
      } else {
        originMarkerRef.current.setMap(null);
      }
      originMarkerRef.current = null;
    }

    // === markersRef 또는 centerMarkerRef에서 해당 마커 찾기 ===
    let targetMarker = null;

    const found = markersRef.current.find(
      (entry) => entry.data.statId === selectedStation.statId
    );
    if (found) {
      targetMarker = found.marker;
    } else if (
      centerMarkerRef.current &&
      centerMarkerRef.current.dataStatId === selectedStation.statId
    ) {
      targetMarker = centerMarkerRef.current;
    }

    if (targetMarker) {
      // 아이콘 백업하고 출발지 아이콘으로 변경
      targetMarker.originalIcon = targetMarker.getIcon();
      targetMarker.setIcon("/img/logos/start.png");
      originMarkerRef.current = targetMarker;
    } else {
      // 마커가 없으면 새로 생성
      const marker = new window.Tmapv2.Marker({
        position,
        map: mapInstance.current,
        icon: "/img/logos/start.png",
        iconAnchor: new Tmapv2.Point(18, 48),
      });
      originMarkerRef.current = marker;
    }

    // === 출발지 상태 반영 ===
    setOriginInput(
      selectedStation.statNm ||
        selectedStation.name ||
        selectedStation.addr ||
        ""
    );
    setMode("route");
  };
  const handleSetDest = () => {
    if (!selectedStation || !mapInstance.current) return;

    const position = new window.Tmapv2.LatLng(
      selectedStation.lat,
      selectedStation.lon
    );

    // === 이전 출발지 마커 복원 ===
    if (destMarkerRef.current) {
      if (destMarkerRef.current.destIcon) {
        destMarkerRef.current.setIcon(destMarkerRef.current.destIcon);
      } else {
        originMarkerRef.current.setMap(null);
      }
      destMarkerRef.current = null;
    }

    // === markersRef 또는 centerMarkerRef에서 해당 마커 찾기 ===
    let targetMarker = null;

    const found = markersRef.current.find(
      (entry) => entry.data.statId === selectedStation.statId
    );
    if (found) {
      targetMarker = found.marker;
    } else if (
      centerMarkerRef.current &&
      centerMarkerRef.current.dataStatId === selectedStation.statId
    ) {
      targetMarker = centerMarkerRef.current;
    }

    if (targetMarker) {
      // 아이콘 백업하고 출발지 아이콘으로 변경
      targetMarker.destIcon = targetMarker.getIcon();
      targetMarker.setIcon("/img/logos/end.png");
      destMarkerRef.current = targetMarker;
    } else {
      // 마커가 없으면 새로 생성
      const marker = new window.Tmapv2.Marker({
        position,
        map: mapInstance.current,
        icon: "/img/logos/end.png",
        iconAnchor: new Tmapv2.Point(18, 48),
      });
      destMarkerRef.current = marker;
    }

    // === 출발지 상태 반영 ===
    setDestInput(
      selectedStation.statNm ||
        selectedStation.name ||
        selectedStation.addr ||
        ""
    );
    setMode("route");
  };

  // 필터 설정 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === "provider") {
      // 수정: provider 체크박스 토글
      setFilterOptions((prev) => {
        const setCodes = new Set(prev.provider);
        if (checked) setCodes.add(value);
        else setCodes.delete(value);
        return { ...prev, provider: Array.from(setCodes) };
      });
      return;
    }

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
      filterOptions,
      originMarkerRef, // ← 반드시 추가
      destMarkerRef
    );
    setActiveDropdown(null);
  };

  // === 선택 구간 텍스트 표시 ===
  const outputText =
    filterOptions.outputMin === 0 && filterOptions.outputMax === 350
      ? "전체"
      : `${filterOptions.outputMin}kW 이상 ~ ${filterOptions.outputMax}kW 이하`;

  const moveToCurrentLocation = () => {
    const map = mapInstance.current;
    const userMarker = userMarkerRef.current;

    if (!map || !userMarker) {
      alert("지도가 초기화되지 않았거나, 사용자 위치가 설정되지 않았습니다.");
      return;
    }

    const position = userMarker.getPosition(); // 마커 위치 가져오기

    map.setCenter(position); // 지도 중심을 해당 위치로 이동

    // 중심 상태 업데이트 (선택)
    centerLatRef.current = position._lat;
    centerLonRef.current = position._lng;
  };

  // 경로추천 버튼
  const handleRecommendClick = () => {
    if (!originInput.trim() || !destInput.trim()) {
      alert("출발지와 도착지를 모두 입력해주세요.");
      return;
    }
    navigate("/recommendRoute", {
      state: {
        originInput,
        destInput,
        filterOptions,
      },
    });
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

  // 화면 부분
  return (
    <div style={{ position: "relative" }}>
      {/* ─── 검색/경로 입력창 (지도 위 고정) ─── */}
      <div className="search-fixed-container">
        {mode === "search" ? (
          <AutocompleteInput
            label="검색"
            value={searchInput}
            onChange={setSearchInput}
            onSelect={(item) => {
              handleSearchSelect(item, "search");
              // 검색창 자체는 유지(여기선 출발/도착으로 안 바꿈)
            }}
          />
        ) : (
          <>
            <AutocompleteInput
              label="출발지"
              value={originInput}
              onChange={setOriginInput}
              onSelect={(item) => handleSearchSelect(item, "origin")}
              // ***자동완성 없이 그냥 남겨두고, 패널 버튼으로 확정***
            />
            <button className="swap-button" onClick={handleSwap}>
              🔄
            </button>
            <AutocompleteInput
              label="도착지"
              value={destInput}
              onChange={setDestInput}
              onSelect={(item) => handleSearchSelect(item, "dest")}
            />
            <button className="recommend-button" onClick={handleRecommendClick}>
              경로 추천
            </button>
          </>
        )}
      </div>

      {/* 필터 아이콘 및 창 */}

      <div className="home-container">
        {/* 🔹 2. 햄버거 버튼 추가 */}
        <button
          className="hamburger-button"
          onClick={() => setShowDrawer(true)}
        >
          ☰
        </button>
        {/* 리스트보기 버튼 */}
        <button
          className="seal-button"
          onClick={handleShowList}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1001 }}
        >
          <span className="emoji">{showList ? "❌" : "🦭"}</span>{" "}
          {showList ? "닫기" : "리스트 보기"}
        </button>
        {/* 지도 위 인라인 필터 바 */}
        <div className="inline-filter-bar">
          {/* 필터 아이콘 및 창 */}
          <div className="inline-filter-wrapper">
            <button
              onClick={() => toggleDropdown("filter")}
              className="filter-button"
            >
              <FontAwesomeIcon icon={faSliders} />
            </button>

            {activeDropdown === "filter" && (
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
                <div
                  style={{ margin: "10px 0 0", fontWeight: 600, fontSize: 16 }}
                >
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8, // 항목과 버튼 간 간격
                    }}
                  >
                    <legend>충전기 타입:</legend>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={
                          filterOptions.type.length ===
                          chargerTypeOptions.length
                        }
                        onChange={(e) =>
                          setFilterOptions((prev) => ({
                            ...prev,
                            type: e.target.checked
                              ? chargerTypeOptions.map((opt) => opt.code)
                              : [],
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  {chargerTypeOptions.map((option) => (
                    <label
                      key={option.code}
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      <input
                        type="checkbox"
                        name="type"
                        value={option.code}
                        checked={filterOptions.type.includes(option.code)}
                        onChange={handleFilterChange}
                      />
                      {" " + option.label}
                    </label>
                  ))}
                </fieldset>

                {/* 사업자 필터 섹션 */}
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      사업자
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={
                          filterOptions.provider.length ===
                          providerOptions.length
                        }
                        onChange={(e) =>
                          setFilterOptions((prev) => ({
                            ...prev,
                            provider: e.target.checked
                              ? providerOptions.map((opt) => opt.code)
                              : [],
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      marginTop: 4,
                    }}
                  >
                    {providerOptions.map((opt) => (
                      <label
                        key={opt.code}
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        <input
                          type="checkbox"
                          name="provider"
                          value={opt.code}
                          checked={filterOptions.provider.includes(opt.code)}
                          onChange={handleFilterChange}
                        />
                        {" " + opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={applyFilters}>필터 적용</button>
              </div>
            )}
          </div>{" "}
          <button onClick={() => toggleDropdown("speed")}>충전속도 ▾</button>
          {activeDropdown === "speed" && (
            <div className="dropdown speed-dropdown">
              <select
                name="outputMin"
                value={filterOptions.outputMin}
                onChange={handleSpeedChange}
              >
                {" "}
                {outputOptions.map((v) => (
                  <option key={v} value={v}>
                    {v === 0 ? "완속" : `${v}kW`}
                  </option>
                ))}
              </select>
              <span style={{ margin: "0 8px" }}>~</span>
              <select
                name="outputMax"
                value={filterOptions.outputMax}
                onChange={handleSpeedChange}
              >
                {" "}
                {outputOptions.map((v) => (
                  <option key={v} value={v}>
                    {v === 0 ? "완속" : `${v}kW`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={() => toggleDropdown("type")}>충전타입 ▾</button>
          {activeDropdown === "type" && (
            <div className="dropdown type-dropdown">
              {chargerTypeOptions.map((opt) => (
                <label
                  key={opt.code}
                  style={{ display: "block", marginBottom: 4 }}
                >
                  <input
                    type="checkbox"
                    value={opt.code}
                    checked={filterOptions.type.includes(opt.code)}
                    onChange={handleInlineTypeChange}
                  />{" "}
                  {opt.label}
                </label>
              ))}
            </div>
          )}
        </div>
        {/* <h2>전기차 충전소 홈 </h2> */}
        <div id="map_div" ref={mapRef} className="map-container"></div>
        <div
          className={`station-info-panel ${selectedStation ? "visible" : ""}`}
        >
          {selectedStation && (
            <>
              <p>{selectedStation.statNm}</p>
              <p>{selectedStation.bnm}</p>
              <p>{selectedStation.addr}</p>
              <p>{selectedStation.statId}</p>
              <p>{selectedStation.chgerId}</p>
              <div className="station-info-buttons">
                <button onClick={handleSetOrigin}>출발지</button>
                <button onClick={handleSetDest}>도착지</button>
              </div>
              <button onClick={() => setSelectedStation(null)}>닫기</button>
            </>
          )}
        </div>
        {showList && (
          <div
            className="station-list-container"
            style={{
              position: "absolute",
              top: 60,
              right: 10,
              width: 300,
              maxHeight: "70vh",
              overflowY: "auto",
              background: "#fff",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>추천 충전소 리스트</h3>
              <button
                onClick={() => setShowList(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
                title="닫기"
              >
                ❌
              </button>
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              {stations.map((st, idx) => (
                <li
                  key={st.statId + idx}
                  className="station-item"
                  style={{
                    marginBottom: "12px",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "8px",
                  }}
                >
                  <strong>{st.statNm}</strong> ({st.bnm})<br />
                  {st.addr}
                  <br />
                  점수: {st.recommendScore}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 3. 사이드 드로어 */}
        {showDrawer && (
          <div className="side-drawer" ref={drawerRef}>
            {/* 상단: 프로필 + 로그인 */}
            <div className="drawer-top-row">
              <img
                src="/img/profile-default.png"
                alt="프로필"
                className="profile-image"
              />
              <div className="login-links">회원가입 | 로그인</div>
            </div>
            <div className="drawer-welcome">
              차지차지와 함께 행복한 하루 보내세요!
            </div>

            {/* 하단: 아이콘 + 메뉴 텍스트 2열 */}
            <div className="drawer-body">
              <div className="icon-column">
                <div onClick={() => setActiveMenu("mypage")}>
                  <img src="/img/icon-profile.png" alt="마이페이지" />
                </div>
                <div onClick={() => setActiveMenu("community")}>
                  <img src="/img/icon-community.png" alt="커뮤니티" />
                </div>
                <div onClick={() => setActiveMenu("support")}>
                  <img src="/img/icon-support.png" alt="고객센터" />
                </div>
                <div onClick={() => setActiveMenu("settings")}>
                  <img src="/img/icon-settings.png" alt="설정" />
                </div>
              </div>

              <div className="text-column">
                {activeMenu === "mypage" && (
                  <div className="text-list">
                    <div className="text-item">내 활동</div>
                    <div className="text-item">내가 쓴 글 보기</div>
                    <div className="text-item">충전소 제보 내역</div>
                  </div>
                )}
                {activeMenu === "community" && (
                  <div className="text-list">
                    <div className="text-item">자유게시판</div>
                    <div className="text-item">정보공유</div>
                  </div>
                )}
                {activeMenu === "support" && (
                  <div className="text-list">
                    <div className="text-item">문의하기</div>
                    <div className="text-item">자주 묻는 질문</div>
                  </div>
                )}
                {activeMenu === "settings" && (
                  <div className="text-list">
                    <div className="text-item">알림 설정</div>
                    <div className="text-item">계정 설정</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <button
          className="current-location-button"
          onClick={moveToCurrentLocation}
          title="현위치로 이동"
        >
          <FontAwesomeIcon icon={faLocationArrow} />
        </button>
      </div>
    </div>
  );
}
