# AgroAI Design System: Theme and Localization

## Runtime ownership

`design_folder/` is the visual reference and remains read-only. Runtime implementation lives in `frontend/src/index.css`, with providers in `frontend/src/theme/ThemeContext.tsx` and `frontend/src/i18n/`.

## Color roles

The application uses semantic roles rather than raw page-specific colors:

- `surface` and `background` — page and navigation surfaces
- `surface-container-lowest` through `surface-container-high` — cards, panels, and grouped controls
- `on-surface` and `on-surface-variant` — primary and secondary text
- `primary`, `primary-container`, and `on-primary` — brand actions and selected navigation
- `secondary` and `secondary-container` — agricultural status and positive controls
- `outline` and `outline-variant` — borders and dividers
- `error` and `error-container` — destructive actions and alerts

Light mode preserves the Stitch palette. Dark mode maps the same roles to a forest-and-slate palette, with a muted green accent rather than neon or pure black.

## Adding a theme token

1. Add or adjust the role in the `@theme` reference block in `frontend/src/index.css` when the token is a new Tailwind role.
2. Add a runtime value to both `:root, [data-theme='light']` and `[data-theme='dark']`.
3. Update the corresponding utility in the Stitch color utility section if the role is hand-defined.
4. Check focus rings, disabled states, charts, inline SVG labels, and status colors in both themes.

Do not use `filter: invert()` or other crude inversion. Fixed colors that represent data or map overlays should remain intentional; fixed colors that represent UI surfaces, text, borders, or controls should use semantic variables/classes.

## Localization

Locale resources are split into `en.ts` and `bn.ts`. Keys are feature-oriented and values may use `{placeholder}` interpolation. Add a key to both files before using it. `t()` falls back to the English key or explicit fallback, but application-controlled text should have a real Bangla resource.

Preserve canonical values used by comparisons, requests, Firestore documents, routes, and algorithms. Translate their display labels only. User-entered names, notes, chat messages, and uploaded content remain verbatim.

## Language and theme preferences

- Language key: `agroai-language`, values `en` and `bn`
- Theme key: `agroai-theme`, values `light` and `dark`
- Both providers survive route navigation and refresh.
- `frontend/index.html` applies the saved theme before React mounts to reduce first-paint flashing.
- Bangla is left-to-right. The document language attribute changes between `en` and `bn`; no RTL mode is enabled.
- Noto Sans Bengali is included as a glyph fallback after Inter.
