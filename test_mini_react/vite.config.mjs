import react from '@vitejs/plugin-react';

export default {
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': {}, process: {}, global: 'globalThis' },
  plugins: [react()],
  server: {
    strictPort: false,
    cors: true
  }
};
