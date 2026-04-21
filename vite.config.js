import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ← allows access via IP address
    port: 5173, // optional: choose your port
  },
  base: '/sandbox-adviser-simplicity/',
});
