import React, { useEffect, useState, useMemo } from "react";
import { getUserInfo, logoutUser } from "../api/member";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Mypage.css";

export default function Mypage() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("accessToken"));

  useEffect(() => {
    getUserInfo(token)
      .then((res) => setUser(res))
      .catch(() => setMessage("사용자 정보를 불러오지 못했습니다."));
  }, [token]);

  const handleLogout = async () => {
    await logoutUser(token);
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const handleEditProfile = () => navigate("/editprofile");
  const handleCarRegister = () => navigate("/carRegister");

  if (!user) return <div className="mypage-container">로딩 중...</div>;

  return (
    <div className="mypage-container">
      <div className="top-link">
        <Link to="/home" className="home-link">
          <FaArrowLeft className="home-icon" />
        </Link>
      </div>

      <h2>MyPage</h2>

      <div className="info-box">
        <div className="info-text">
          <p>
            <strong>아이디:</strong> {user.userId}
          </p>
          <p>
            <strong>이름:</strong> {user.userName}
          </p>
        </div>
        <button className="edit-btn" onClick={handleEditProfile}>
          회원정보 수정
        </button>
      </div>

      <hr />

      <h3>내 차량</h3>
      <div className="car-box" onClick={handleCarRegister}>
        <div className="car-image" />
        <span className="car-text">내 전기차를 등록해보세요!</span>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        로그아웃
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
