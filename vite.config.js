import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default {
  server: {
    proxy: {
      // key : value로 Spring 프로젝트 restapi 연결
      "/api": "http://localhost:8082",
    },
  },
};
