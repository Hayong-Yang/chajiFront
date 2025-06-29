import React, { useEffect, useState, useMemo } from "react";
import { getUserInfo, logoutUser } from "../api/member";
import { useNavigate, Link } from "react-router-dom";

export default function Mypage() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  // const token = localStorage.getItem('token')
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("accessToken"));

  useEffect(() => {
    getUserInfo(token)
      .then((res) => setUser(res))
      .catch(() => setMessage("사용자 정보를 불러오지 못했습니다."));
  }, [token]);

  if (!user) return <div>로딩 중...</div>;

  const handleLogout = async () => {
    await logoutUser(token);
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <div>
      <h2>마이페이지</h2>
      <p>아이디: {user.userId}</p>
      <p>이름: {user.userName}</p>
      <button onClick={handleLogout}>로그아웃</button>
      <hr />
      <h3>메뉴</h3>
      <p>
        <Link to="/editprofile">회원정보 수정</Link>
      </p>
      {/* <p>
        <Link to="/board">게시판</Link>
      </p> */}
      <p>{message}</p>
    </div>
  );
}
