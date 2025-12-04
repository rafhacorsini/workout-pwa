import { defineConfig } from 'vite';

export default defineConfig({
    // Base public path when served in production
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
    },
    server: {
        port: 3000,
        open: true
    },
    // Ensure public directory is served correctly
    publicDir: 'public'
});
