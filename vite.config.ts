import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  root: '.',
  // Serve the arcade client from the subpath on Cloudflare Pages
  // Use root path for local development, subpath for production
  // Use root path for 'root' mode (deploying to root domain)
  base: mode === 'root' ? '/' : (process.env.NODE_ENV === 'production' ? '/arcade-client/' : '/'),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure proper static asset handling for Cloudflare Pages
    assetsDir: 'assets',
    // Optimize for Cloudflare Pages
    minify: 'esbuild', // Use esbuild instead of terser for better compatibility
    rollupOptions: {
      output: {
        // Ensure consistent asset naming for caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Optimize chunk splitting for better caching
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          pocketbase: ['pocketbase']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3051,
    host: '0.0.0.0', // Allow external connections
    strictPort: true
  },
  optimizeDeps: {
    // No heavy dependencies to pre-bundle
  },
  // Ensure proper handling of environment variables
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
}))


