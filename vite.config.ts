import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites at https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
});
