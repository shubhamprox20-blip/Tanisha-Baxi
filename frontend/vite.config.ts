import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy API + uploaded-asset requests to the Express backend so the app
// runs on a single origin (cookies work without CORS juggling).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:5000";
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/uploads": { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
