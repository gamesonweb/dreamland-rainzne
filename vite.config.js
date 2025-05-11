import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' 
    ? "/GoW-2025-Astra-Lumina-Dream-Explorer/" 
    : "/",
  
  build: {
    // Assurez-vous que les assets sont correctement traités
    assetsInlineLimit: 0,
    sourcemap: true,
    
    rollupOptions: {
      input: {
        main: 'home.html',
        game: 'index.html'
      }
    }
  },
  
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  },
  
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Access-Control-Allow-Origin': '*'
    },
    open: '/home.html' 
  },
});
