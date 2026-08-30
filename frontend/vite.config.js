import { defineConfig } from 'vite'
import { mkdirSync, readdirSync, copyFileSync } from 'fs'

// Copie récursivement uniquement les .css de src/ vers dist/src/
// pour que les injections dynamiques de <link href="/src/pages/*.css"> fonctionnent
function copySrcCssPlugin() {
  function walk(srcDir, destDir) {
    mkdirSync(destDir, { recursive: true })
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      const s = `${srcDir}/${entry.name}`
      const d = `${destDir}/${entry.name}`
      if (entry.isDirectory()) walk(s, d)
      else if (entry.name.endsWith('.css')) copyFileSync(s, d)
    }
  }
  return {
    name: 'copy-src-css',
    closeBundle() {
      try { walk('./src', './dist/src') } catch {}
    }
  }
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [copySrcCssPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/pages/TeacherPage') || id.includes('/src/pages/AdminPage')) {
            return 'pages-admin'
          }
          if (id.includes('/src/services/')) return 'services'
          if (id.includes('/src/pages/')) return 'pages'
        }
      }
    }
  },
  server: { port: 3456 }
})
