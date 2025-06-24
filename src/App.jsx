import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Poi from "./pages/Poi";


export default function App() {
  return (
    // Routes는 여러 Route를 묶는 컨테이너입니다.
    // path="/"는 기본 루트 URL입니다.→ 이 경로로 들어오면 자동으로 /login으로 리디렉션합니다.
    // 각 경로에 따라 해당 컴포넌트(Login, Register)가 렌더링됩니다.

    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/poi" element={<Poi/>}/>
    </Routes>

  );
}

//Navigate: 특정 경로로 자동 이동할 때 사용 (예: 기본 URL에서 로그인으로 강제 이동)
