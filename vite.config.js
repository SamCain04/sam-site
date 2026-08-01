import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base so the same build works from a domain root, a GitHub Pages
  // project subpath (/repo-name/), or a local `vite preview`.
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
