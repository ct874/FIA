import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `worker/` is a separate TypeScript project (checked via `npm run
  // worker:typecheck` -> `tsc --noEmit`, not this config) — excluded here
  // so a root `npm run lint` never picks up worker/.wrangler's local-dev
  // build cache (a bundled build artifact containing every dependency,
  // e.g. xlsx's decompression internals, that floods unrelated
  // `.js`-pattern errors once `wrangler dev`/`wrangler deploy --dry-run`
  // has been run locally at least once).
  globalIgnores(['dist', 'worker']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
