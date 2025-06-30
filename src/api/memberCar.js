import axios from "axios";

export const getMyCars = async (token) => {
  const res = await axios.get("/api/member-car/list", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
