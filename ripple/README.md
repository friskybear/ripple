# Ripple

Desktop client for the Ripple signal log. Tauri 2 + React 19 + TypeScript + Vite, styled with Tailwind CSS 4.

## Run it

The frontend talks to the Laravel API in `../backend` through the Vite dev proxy, so both apps share one origin and the session cookie works in the browser and in the Tauri webview.

```bash
# terminal 1
cd backend
php artisan serve --port=8000

# terminal 2
cd ripple
bun install
bun run dev
```

Open http://localhost:1420. If the API lives somewhere else, set `RIPPLE_API_URL` before starting Vite (default `http://localhost:8000`). The backend must list `localhost:1420` in `SANCTUM_STATEFUL_DOMAINS`.

For the desktop shell: `bun run tauri dev`.

## Checks

```bash
bun run typecheck   # tsc --noEmit
bun run test        # vitest (jsdom + Testing Library)
bun run build       # typecheck + production build
```
