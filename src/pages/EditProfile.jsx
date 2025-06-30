import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserInfo, updateUser, logoutUser } from "../api/member";
import { FaArrowLeft } from "react-icons/fa";
import "./EditProfile.css";

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("accessToken"));
  // useMemo : 특정 값을 기억(memoize) 해서 불필요한 재계산을 막는 React 훅

  useEffect(() => {
    getUserInfo(token)
      .then((res) => {
        setUser(res);
        setUserName(res.userName);
      })
      .catch(() => setMessage("사용자 정보를 불러오지 못했습니다."));
  }, [token]);

  if (!user) return <div>로딩 중...</div>;

  const handleUpdate = async () => {
    try {
      await updateUser({ userName, password }, token);
      setMessage("회원정보가 수정되었습니다");
      navigate("/mypage");
    } catch (e) {
      setMessage("수정 실패");
    }
  };

  const handleLogout = async () => {
    await logoutUser(token);
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <div className="edit-container">
      <div className="top-link">
        <Link to="/mypage" className="home-link">
          <FaArrowLeft className="home-icon" />
        </Link>
      </div>

      <h2>회원정보 수정</h2>

      <div className="info-box">
        <p>
          <strong>아이디:</strong> {user.userId}
        </p>
      </div>

      <div className="input-box">
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="새 비밀번호"
        />
      </div>

      <div className="input-box">
        <label>이름</label>
        <input value={userName} onChange={(e) => setUserName(e.target.value)} />
      </div>

      <button className="btn primary" onClick={handleUpdate}>
        수정하기
      </button>
      <button className="btn secondary" onClick={handleLogout}>
        로그아웃
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
