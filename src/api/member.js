import axios from "axios";

const BASE_URL = "http://localhost:8082/api/member";

export const registerUser = async (user) => {
    const res = await axios.post(`${BASE_URL}/register`, user);
    return res.data;
};

export const loginUser = async (userId, password) => {
    const res = await axios.post(`${BASE_URL}/login`, { userId, password });
    return res.data;
};

export const logoutUser = async (token) => {
    const res = await axios.get(`${BASE_URL}/logout`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const getUserInfo = async (token) => {
    const res = await axios.get(`${BASE_URL}/info`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
    });
    return res.data;
};
