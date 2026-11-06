# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Testing

Regression tests run with **Vitest** (node environment, no DOM needed):

```bash
npm test          # vitest run  (CI mode)
npm run test:watch
```

- `src/store/useCartStore.test.js` — regression tests for the POS cart: numeric
  derived totals (`subtotal`/`tax`/`total`/`itemCount` — previously exposed as
  functions which broke the POS UI), quantity merging, and the tax rate being
  driven by the **general settings** store (`useSettingsStore`) so the POS
  always matches the rate configured in Settings (14% default).
- Component/integration tests (React Testing Library + `vitest` with
  `environment: "jsdom"` — `npm i -D jsdom @testing-library/react
  @testing-library/user-event`) are the recommended next step for the
  high-risk UI flows (POS checkout modal, shift open/close, settings save);
  the store-level tests above cover the shared logic those flows rely on.
