import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 三种产物：
// - dev：根路径
// - build：GitHub Pages 子路径 /lightwheel-leads/juben-tycoon/
// - build --mode standalone：把 JS/CSS 全部内联成单个 index.html，双击即玩、零依赖
export default defineConfig(({ command, mode }) => {
  const standalone = mode === 'standalone'
  return {
    base: standalone ? './' : command === 'build' ? '/lightwheel-leads/juben-tycoon/' : '/',
    plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
    build: standalone ? { outDir: 'standalone', assetsInlineLimit: 100_000_000 } : {},
    server: { port: 5174, open: false },
  }
})
