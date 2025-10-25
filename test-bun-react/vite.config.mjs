import react from '@vitejs/plugin-react';

export default {
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': {}, process: {}, global: 'globalThis' },
  plugins: [react()],
  build: {
    outDir: '.tugboats-dist',
    sourcemap: false,
    manifest: true,
    lib: {
      entry: './app.tsx',
      formats: ['es'],
      fileName: () => 'reactapp-dev.js'
    },
    rollupOptions: {
      external: ['@tugboats/core']
    }
  }
};
