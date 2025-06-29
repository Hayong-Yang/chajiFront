import React, { useEffect, useState } from "react";
import axios from "axios";

function FavoritePage() {
    const [favorites, setFavorites] = useState([]);
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        if (token) {
            axios
                .get("/api/favorite/list", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    console.log("받은 데이터:", res.data); // 🔍 디버깅용
                    setFavorites(res.data);
                })
                .catch((err) => console.error("즐겨찾기 로딩 실패", err));
        }
    }, [token]);

    const handleDelete = (statId) => {
        axios
            .delete(`/api/favorite/delete?statId=${statId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => {
                setFavorites(favorites.filter((fav) => fav.stat_id !== statId));
            })
            .catch((err) => console.error("삭제 실패", err));
    };

    return (
        <div style={{ padding: "16px" }}>
            <h2>즐겨찾기</h2>
            {favorites.map((station, idx) => (
                <div
                    key={idx}
                    style={{
                        background: "#f5f5f5",
                        borderRadius: "10px",
                        padding: "16px",
                        marginBottom: "10px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <div>
                            {/* ✅ 충전소 이름 */}
                            <strong>{station.stat_nm}</strong>
                            <br />
                            {/* ✅ 주소 */}
                            <span style={{ fontSize: "14px", color: "#555" }}>
                                {station.addr}
                            </span>
                            <br />
                            {/* ✅ 충전 상태 */}
                            <span
                                style={{
                                    color:
                                        station.stat === "2" ? "green" : "gray",
                                }}
                            >
                                {station.stat === "2" ? "충전가능" : "충전중"}
                            </span>{" "}
                            {/* ✅ 충전 타입 */}
                            &nbsp; {station.chger_type}
                        </div>
                        <div>
                            <span
                                style={{ color: "orange", marginRight: "10px" }}
                            >
                                🔔
                            </span>
                            <span
                                style={{ color: "orange", cursor: "pointer" }}
                                onClick={() => handleDelete(station.stat_id)}
                            >
                                ⭐
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FavoritePage;
