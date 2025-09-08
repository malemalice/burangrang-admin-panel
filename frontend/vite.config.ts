import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/modules": path.resolve(__dirname, "./src/modules"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
    },
  },
}));
