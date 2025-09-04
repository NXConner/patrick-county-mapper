import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'patrick-county-icon.svg', 'icons/icon-16x16.png', 'icons/icon-32x32.png'],
      manifest: false, // use existing public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /arcgisonline\.com\/ArcGIS\/rest\/services\/.*\/tile\//.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-esri',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => /basemaps\.cartocdn\.com\/.+\/(\{z\}|\d+)\//.test(url.href) || /cartocdn\.com\/.+\/(\{z\}|\d+)\//.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-carto',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => /tile\.openstreetmap\.org\//.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-osm',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => /mt1\.google\.com\/vt\//.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-google',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 3 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => /virtualearth\.net\/tiles\//.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tiles-bing',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 3 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => /nominatim\.openstreetmap\.org\//.test(url.href),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-geocode',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
        ]
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI framework
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            'lucide-react',
            'sonner'
          ],
          // Map and GIS libraries
          maps: ['leaflet', '@turf/turf'],
          // Forms and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Data management
          data: ['@tanstack/react-query', '@supabase/supabase-js'],
          // Utilities
          utils: ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    },
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'leaflet',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ]
  }
}));
