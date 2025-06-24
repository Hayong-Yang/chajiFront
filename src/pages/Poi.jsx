import React, { useState, useEffect, useRef } from "react";
import { fetchAutocomplete, moveMapTo } from "../api/poi";

function AutocompleteInput({ label, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // 자동완성 결과 가져오기
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      const data = await fetchAutocomplete(value.trim());
      setSuggestions(data);
      setShowList(true);
    }, 300);
  }, [value]);

  // 외부 클릭 시 자동완성 리스트 닫기
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
    <div style={{ position: "relative", marginBottom: 20, maxWidth: 400 }} ref={wrapperRef}>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${label} 입력`}
        autoComplete="off"
        onFocus={() => {
          if (suggestions.length > 0) setShowList(true);
        }}
        style={{ width: "100%", padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
      />
      {showList && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            borderTop: "none",
            maxHeight: 200,
            overflowY: "auto",
            listStyle: "none",
            margin: 0,
            padding: 0,
            zIndex: 1000,
          }}
        >
          {suggestions.map((item) => (
            <li
              key={`${item.name}-${item.lat}-${item.lon}`}
              onClick={() => {
                onSelect(item);
                setShowList(false);
              }}
              style={{ padding: 8, borderBottom: "1px solid #eee", cursor: "pointer" }}
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

export default function Poi() {
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");

  useEffect(() => {
    if (!window.Tmapv2 || window.map) return;

    const map = new window.Tmapv2.Map("map_div", {
      center: new window.Tmapv2.LatLng(37.5665, 126.9780),
      width: "100%",
      height: "700px",
      zoom: 16,
    });
    window.map = map;
  }, []);

  const handleOriginSelect = (item) => {
    setOriginInput(item.name);
    moveMapTo(item.lat, item.lon);
  };

  const handleDestSelect = (item) => {
    setDestInput(item.name);
    moveMapTo(item.lat, item.lon);
  };

  return (
    <div className="poi-wrapper">
      <AutocompleteInput
        label="출발지"
        value={originInput}
        onChange={setOriginInput}
        onSelect={handleOriginSelect}
      />
      <AutocompleteInput
        label="도착지"
        value={destInput}
        onChange={setDestInput}
        onSelect={handleDestSelect}
      />
      <div id="map_div" className="map-area" style={{ marginTop: 20 }}></div>
    </div>
  );
}
