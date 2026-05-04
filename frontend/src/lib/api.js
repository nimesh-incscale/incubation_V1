import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        "X-API-Key": import.meta.env.VITE_API_SECRET_KEY,
    },
});

export default api;