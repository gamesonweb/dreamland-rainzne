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
    // Ajouter la configuration MIME explicite
    configure: (server) => {
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.ts')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        next();
      });
    }
  },
  
  define: {
    'process.env': {}
  }
});
