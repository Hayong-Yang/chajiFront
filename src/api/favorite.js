import axios from "axios";

// 즐겨찾기 추가 (POST)
export const addFavorite = (statId, token) => {
    return axios.post(
        "/api/favorite",
        { statId }, // 서버에서는 DTO로 statId 받음
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

// 즐겨찾기 삭제 (DELETE)
export const deleteFavorite = (statId, token) => {
    return axios.delete(`/api/favorite/delete?statId=${statId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// 즐겨찾기 여부 확인 (GET)
export const checkFavorite = (statId, token) => {
    return axios.get(`/api/favorite/check?statId=${statId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// 즐겨찾기 목록 전체 조회 (옵션)
export const getFavoriteList = (token) => {
    return axios.get("/api/favorite/list", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
