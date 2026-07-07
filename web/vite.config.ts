import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import fs from 'fs'
import path from 'path'

let appVersion = 'dev'
try {
  const pyprojectPath = path.resolve(__dirname, '../pyproject.toml')
  const pyprojectContent = fs.readFileSync(pyprojectPath, 'utf-8')
  const versionMatch = pyprojectContent.match(/version\s*=\s*"([^"]+)"/)
  if (versionMatch && versionMatch[1]) {
    appVersion = versionMatch[1]
  }
} catch (e) {}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    tsconfigPaths(),
    devtools(),
    tailwindcss(),
    TanStackRouterVite(),
    viteReact(),
  ],
})
