// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, 
    port: 5173,
    strictPort: true, 
    cors: true,
    allowedHosts:[
        'hubwork192.ischool.illinois.edu'
    ]
  }
});
