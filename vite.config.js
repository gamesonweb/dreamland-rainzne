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
    open: '/home.html',
    middlewareMode: false,
    fs: {
      strict: false
    },
    // Configuration MIME plus spécifique et agressive
    configure: (server) => {
      server.middlewares.use((req, res, next) => {
        // Forcer le MIME type pour tous les fichiers TypeScript
        if (req.url && req.url.includes('.ts')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        next();
      });
    }
  },
  
  define: {
    'process.env': {}
  }
});
