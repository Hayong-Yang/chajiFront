import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Community.css";

export default function Community() {
  const navigate = useNavigate();

  const dummyPosts = [
    {
      id: 1,
      title: "서울 충전소 추천해주세요 🐧",
      author: "hyejin",
      date: "2025.07.01",
    },
    {
      id: 2,
      title: "충전소에서 이런 경험 해보셨나요?",
      author: "hyeonseogo",
      date: "2025.06.30",
    },
    {
      id: 3,
      title: "완속충전기와 급속충전기 차이점 정리",
      author: "dhkim",
      date: "2025.06.28",
    },
    {
      id: 4,
      title: "완속충전기와 급속충전기 차이점 정리",
      author: "ha2yong",
      date: "2025.06.28",
    },
  ];

  return (
    <div className="community-container">
      <div className="top-link">
        <Link to="/home" className="home-link">
          <FaArrowLeft className="home-icon" />
        </Link>
      </div>
      <header className="community-header">🔌 차지차지 커뮤니티</header>

      <div className="post-list">
        {dummyPosts.map((post) => (
          <div key={post.id} className="post-item">
            <div className="post-title">{post.title}</div>
            <div className="post-meta">
              <span>{post.author}</span> · <span>{post.date}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        className="write-button"
        onClick={() => alert("글쓰기 페이지 준비 중!")}
      >
        ✍️ 글쓰기
      </button>
    </div>
  );
}
