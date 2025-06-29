import React, { useEffect, useState } from "react";
import axios from "axios";

const FavoriteStations = () => {
    const [favorites, setFavorites] = useState([]);
    const token = localStorage.getItem("accessToken");

    const fetchFavorites = async () => {
        try {
            const res = await axios.get("/api/favorite/stations", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFavorites(res.data);
        } catch (err) {
            console.error("즐겨찾기 조회 실패", err);
        }
    };

    const removeFavorite = async (statId) => {
        try {
            await axios.delete("/api/favorite", {
                headers: { Authorization: `Bearer ${token}` },
                params: { statId },
            });
            fetchFavorites(); // 삭제 후 목록 갱신
        } catch (err) {
            console.error("즐겨찾기 삭제 실패", err);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    return (
        <div>
            <h2>즐겨찾는 충전소 목록</h2>
            <ul>
                {favorites.map((fav, index) => (
                    <li key={index}>
                        {fav.statId}
                        <button onClick={() => removeFavorite(fav.statId)}>
                            삭제
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FavoriteStations;
