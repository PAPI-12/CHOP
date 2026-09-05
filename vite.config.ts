import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      // Required so the sandbox / preview proxy host is accepted.
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      allowedHosts: true,
    },
    esbuild: {
      // Strip debug noise from production; keeps console.error for the boundary.
      pure: ["console.log", "console.debug", "console.info"],
    },
    build: {
      target: "es2020",
      cssCodeSplit: true,
      sourcemap: false,
      // Inline small assets; anything larger gets a hashed file for long caching.
      assetsInlineLimit: 2048,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Long-term cacheable, content-hashed filenames.
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-dom") || /node_modules\/react\//.test(id)) return "react";
            if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "motion";
            if (id.includes("react-router")) return "router";
            if (id.includes("lucide-react")) return "icons";
          },
        },
      },
    },
  };
});
