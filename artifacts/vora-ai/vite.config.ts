import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const port = Number(process.env.PORT) || 5000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon.svg", "icons/maskable-icon.svg"],
      manifest: {
        name: "Vora AI — Website Builder",
        short_name: "Vora AI",
        description: "Turn a single sentence into a fully-coded, SEO-optimised website in seconds.",
        theme_color: "#050505",
        background_color: "#050505",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icons/maskable-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Build a Website", short_name: "Build", url: "/build", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
          { name: "My Projects", short_name: "Projects", url: "/projects", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
