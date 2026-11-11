import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative so the build can be hosted from any folder.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 2500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
} as never);
