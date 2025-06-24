import React, { useState, useEffect, useRef } from 'react';
import { initMap, debounce, fetchPoiSuggestions, placeMarker, swapMarkers } from './tmapUtils';

export default function PoiSearch() {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [infoBoxItem, setInfoBoxItem] = useState(null);

  const originRef = useRef();
  const destRef = useRef();

  useEffect(() => {
    initMap();
  }, []);

  const handleSearch = debounce(async (q, setSuggestions) => {
    if (q.length < 2) return setSuggestions([]);
    const data = await fetchPoiSuggestions(q);
    setSuggestions(data);
  }, 300);

  const handleSelect = (item, type) => {
    placeMarker(item, type);
    if (type === 'origin') setOriginSuggestions([]);
    else setDestSuggestions([]);
    setInfoBoxItem(item);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div>
          <input
            ref={originRef}
            placeholder="출발지를 입력하세요"
            value={originQuery}
            onChange={(e) => {
              setOriginQuery(e.target.value);
              handleSearch(e.target.value, setOriginSuggestions);
            }}
          />
          <ul className="suggest-list">
            {originSuggestions.map((item, i) => (
              <li key={i} onClick={() => handleSelect(item, 'origin')}>{item.name}</li>
            ))}
          </ul>
        </div>
        <button onClick={swapMarkers}>⇄</button>
        <div>
          <input
            ref={destRef}
            placeholder="도착지를 입력하세요"
            value={destQuery}
            onChange={(e) => {
              setDestQuery(e.target.value);
              handleSearch(e.target.value, setDestSuggestions);
            }}
          />
          <ul className="suggest-list">
            {destSuggestions.map((item, i) => (
              <li key={i} onClick={() => handleSelect(item, 'dest')}>{item.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <div id="map" style={{ width: '100%', height: '500px', marginTop: '16px' }} />

      {infoBoxItem && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#fff', borderTop: '1px solid #ccc', padding: '16px', boxShadow: '0 -2px 8px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{infoBoxItem.name}</p>
          <button onClick={() => handleSelect(infoBoxItem, 'origin')}>출발지로</button>
          <button onClick={() => handleSelect(infoBoxItem, 'dest')}>도착지로</button>
        </div>
      )}
    </div>
  );
}
