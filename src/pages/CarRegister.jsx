import React, { useState, useEffect } from "react";
import axios from "axios";

const CarSelection = ({ memberIdx }) => {
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [trims, setTrims] = useState([]);

    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [selectedTrim, setSelectedTrim] = useState("");

    const [nickname, setNickname] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        axios.get("/api/car/brands").then((res) => setBrands(res.data));
    }, []);

    useEffect(() => {
        if (selectedBrand) {
            axios
                .get(`/api/car/models?brand=${selectedBrand}`)
                .then((res) => setModels(res.data));
        } else {
            setModels([]);
        }
        setSelectedModel("");
        setSelectedTrim("");
        setTrims([]);
    }, [selectedBrand]);

    useEffect(() => {
        if (selectedModel) {
            axios
                .get(`/api/car/trims?model=${selectedModel}`)
                .then((res) => setTrims(res.data));
        } else {
            setTrims([]);
        }
        setSelectedTrim("");
    }, [selectedModel]);

    const handleRegister = () => {
        axios
            .post("/api/car/register", {
                memberIdx: parseInt(memberIdx),
                carIdx: parseInt(selectedTrim),
                carNickname: nickname,
            })
            .then((res) => {
                setMessage(res.data);
                Navigate("/home");
            })
            .catch((err) => {
                setMessage(err.response?.data || "등록 실패");
            });
    };

    return (
        <div>
            <h2>차량 등록</h2>

            <div>
                <label>차량 별칭:</label>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                />
            </div>

            <div>
                <label>제조사:</label>
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                >
                    <option value="">선택하세요</option>
                    {brands.map((b) => (
                        <option key={b} value={b}>
                            {b}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label>모델:</label>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                >
                    <option value="">선택하세요</option>
                    {models.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label>트림:</label>
                <select
                    value={selectedTrim}
                    onChange={(e) => setSelectedTrim(e.target.value)}
                >
                    <option value="">선택하세요</option>
                    {trims.map((t) => (
                        <option key={t.carIdx} value={t.carIdx}>
                            {t.trimName}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleRegister}
                disabled={!selectedTrim || !nickname}
            >
                등록하기
            </button>

            {message && <p>{message}</p>}
        </div>
    );
};

export default CarSelection;
