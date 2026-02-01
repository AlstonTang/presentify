import path from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function spaFallbackPlugin() {
	// Rewrites non-asset GET requests that accept HTML to /index.html
	return {
		name: 'spa-fallback',
		configureServer(server: any) {
			server.middlewares.use((req: any, res: any, next: any) => {
				try {
					if (req.method !== 'GET') return next();
					const accept = (req.headers && req.headers.accept) || '';
					// Only rewrite browser navigations that expect HTML
					if (!accept.includes('text/html')) return next();
					const urlPath = (req.url || '').split('?')[0];
					// skip requests for actual files (have extension)
					if (path.extname(urlPath)) return next();
					// serve index.html
					req.url = '/index.html';
				} catch (e) {
					// don't break middleware chain on errors
				}
				next();
			});
		},
		// For vite preview: similar catch-all middleware
		configurePreviewServer(app: any) {
			app.use((req: any, res: any, next: any) => {
				try {
					if (req.method !== 'GET') return next();
					const accept = (req.headers && req.headers.accept) || '';
					if (!accept.includes('text/html')) return next();
					const urlPath = (req.url || '').split('?')[0];
					if (path.extname(urlPath)) return next();
					req.url = '/index.html';
				} catch (e) {}
				next();
			});
		}
	};
}

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
})
