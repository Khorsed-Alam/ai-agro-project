# AgroAI Frontend

The AgroAI frontend is a React 19 + TypeScript + Vite application using Tailwind CSS v4. It is the Stitch-based presentation layer for the agricultural decision-support system.

## Development

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server runs on `http://localhost:3000` and proxies `/api` requests to `http://localhost:8000` when the FastAPI backend is running.

```powershell
npm run lint
npm run build
```

## Frontend structure

- `src/App.tsx` — route definitions and existing redirects
- `src/components/Layout.tsx` — authenticated application shell
- `src/components/Navigation.tsx` — role-aware navigation
- `src/components/PreferenceControls.tsx` — global language and theme controls
- `src/i18n/` — centralized English and Bangla resources and provider
- `src/theme/ThemeContext.tsx` — persisted light/dark preference
- `src/index.css` — Tailwind theme tokens, runtime CSS variables, and shared utilities
- `src/services/` — existing FastAPI, Firebase, Cloudinary, and ecosystem service facades
- `src/pages/` — application route views

## Language support

English (`en`) and Bangla (`bn`) are supported. Application-controlled labels, validation states, statuses, and explanatory text are resolved through `src/i18n/en.ts` and `src/i18n/bn.ts`.

- Default language: English (`en`)
- Persistence key: `agroai-language`
- The selected language is applied to `document.documentElement.lang`.
- User-entered farm names, field names, notes, and messages remain verbatim.
- Technical identifiers, API values, algorithm names, and persisted enum values remain unchanged.

To add a translation, add the same feature key to both locale resources and use it with `t('feature.key')` at the display boundary.

## Theme support

Light and dark themes share the existing agricultural token names. The theme provider stores the selection under `agroai-theme` and applies `data-theme="light"` or `data-theme="dark"` to the document root.

- Default theme: Light
- Supported themes: Light and Dark
- Runtime palette: CSS variables in `src/index.css`
- Theme selection persists across refreshes and routes.
- The initial document script applies the saved theme before React mounts.

The locked `design_folder/` remains a read-only visual reference and is not modified by the frontend build.
