import { defineConfig } from 'vite';

export default defineConfig({  
  base: "/dreamland-rainzne/",
  
  build: {
    assetsInlineLimit: 0,
    sourcemap: true,
    
    rollupOptions: {
      input: {
        main: './index.html',
        home: './home.html'
      }
    }
  },
  
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  },
  
  esbuild: {
    target: 'es2020'
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
