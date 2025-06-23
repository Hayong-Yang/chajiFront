import React, { useEffect, useRef, useState } from "react";

export default function RecommendRoute() {
  const mapRef = useRef(null);
  const [searchOption, setSearchOption] = useState("0");
  const [routeResult, setRouteResult] = useState("");
  const [drawnPolylines, setDrawnPolylines] = useState([]);
  const [waypointMarkers, setWaypointMarkers] = useState([]);
  const startLat = 37.504198,
    startLon = 127.04894;
  const endLat = 35.1631,
    endLon = 129.1635;

  // 지구 반지름 기반 거리 계산 함수
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
    setWaypointMarkers([]); // ← 마커 테스트 추가

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

  const requestRoute = async () => {
    resetMap();
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
    handleRouteResponse(data);

    // 웨이포인트 계산
    let accumulatedDistance = 0;
    let nextTarget = 10000;
    let waypoints = [];

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

          // 🔧 웨이포인트 마커 추가
          const latlng = Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            new Tmapv2.Point(interpolatedX, interpolatedY)
          );
          const marker = new Tmapv2.Marker({
            position: new Tmapv2.LatLng(latlng._lat, latlng._lng),
            map: mapRef.current,
            icon: "/img/logos/default.png", // 원한다면 custom 아이콘 지정
            iconSize: new Tmapv2.Size(36, 36),
          });
          setWaypointMarkers((prev) => [...prev, marker]);
          // 마커 추가 끝

          nextTarget += 10000;
          remaining = nextTarget - accumulatedDistance;
        }

        accumulatedDistance += segmentDistance;
      }
    }

    console.log("🚩 웨이포인트:", waypoints);
  };

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
  };

  return (
    <div>
      <select
        onChange={(e) => setSearchOption(e.target.value)}
        value={searchOption}
      >
        <option value="0">교통최적+추천</option>
        <option value="1">교통최적+무료우선</option>
        <option value="2">교통최적+최소시간</option>
        <option value="4">교통최적+고속도로우선</option>
        <option value="10">최단거리+유/무료</option>
      </select>
      <button onClick={requestRoute}>적용하기</button>
      <div id="map_div"></div>
      <p dangerouslySetInnerHTML={{ __html: routeResult }}></p>
    </div>
  );
}
