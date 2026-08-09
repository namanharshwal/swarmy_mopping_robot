/**
 * ============================================================================
 * Project Handlers: Naman Sain & Souvik Mallik
 * 
 * Maintainers:
 * - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
 * - Souvik Mallik: Embedded Maintainer
 * ============================================================================
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Exposes the server to the local network
    port: 5173,
    strictPort: true
  },
  build: {
    target: 'esnext'
  }
})
