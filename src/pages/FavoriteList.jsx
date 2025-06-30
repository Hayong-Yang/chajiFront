import React from "react";
import { useEffect, useState } from "react";

const FavoriteList = () => {
    const [favorites, setFavorites] = useState([]);
    const token = localStorage.getItem("accessToken");

    const fetchFavorites = async () => {
        try {
            const res = await fetch("/api/favorite/list", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setFavorites(data);
        } catch (err) {
            console.error("즐겨찾기 목록 조회 실패:", err);
        }
    };

    const removeFavorite = async (statId) => {
        try {
            await fetch(`/api/favorite/delete?statId=${statId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setFavorites((prev) => prev.filter((f) => f.statId !== statId));
        } catch (err) {
            console.error("즐겨찾기 삭제 실패:", err);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    return (
        <div className="favorite-container">
            <h2>즐겨찾기</h2>
            {favorites.map((station) => (
                <div className="station-card" key={station.statId}>
                    <div className="station-info">
                        <p className="station-name">{station.statNm}</p>
                        <p className="station-addr">{station.addr}</p>
                        <div className="station-meta">
                            <span
                                className={`status ${
                                    station.stat === "충전가능"
                                        ? "green"
                                        : "gray"
                                }`}
                            >
                                {station.stat}
                            </span>
                            <span>{station.chgerType}</span>
                        </div>
                    </div>
                    <div className="icon-buttons">
                        <button className="alert-button" title="알림설정">
                            🔔
                        </button>
                        <button
                            className="star-button"
                            onClick={() => removeFavorite(station.statId)}
                            title="즐겨찾기 삭제"
                        >
                            ⭐
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FavoriteList;
