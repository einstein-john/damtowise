import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // This controls the warning threshold only (it doesn't change output).
    // We'll still split large deps, but Three.js can remain slightly above 500kB.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Split large dependencies into dedicated chunks to keep the main bundle smaller.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Note: keep chunking coarse to avoid circular-chunk warnings.
          if (id.includes('postprocessing')) return 'postprocessing-vendor';
          if (id.includes('three')) return 'three-vendor';

          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,
    },
  },
});
