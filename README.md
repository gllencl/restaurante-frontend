# Proyecto Final: Restaurante App

## Descripción
App web para mostrar restaurantes, platos, pedidos y clientes. Backend Node.js + MySQL (Docker), frontend React + Vite + Bootstrap.

## Backend
- Endpoints: `/restaurants`, `/dishes`, `/orders`, `/customers`
- Levantar: `docker compose up -d`
- PhpMyAdmin: http://localhost:9091
- API local: http://localhost:4000

## Frontend
- Levantar: `npm install` y `npm run dev`
- URL local: http://localhost:5173
- API: `.env` con `VITE_API_URL=http://localhost:4000` (por defecto usa servidor remoto)

## Cumplimiento de requisitos
- Consumo API externa con `fetch` en `src/services/api.js`.
- Lista de restaurantes en `src/pages/Home.jsx`.
- Detalle con platos, pedidos y clientes en `src/pages/RestaurantPage.jsx`.
- Hooks `useEffect`/`useState` y React Router (`src/App.jsx`).
- UI responsive con Bootstrap y actualización dinámica sin recarga.
- Vite como bundler.
- Git con >= 5 commits claros.

## Despliegue (GitHub Pages)
- URL: https://gllencl.github.io/restaurante-frontend/
- Base configurada en `vite.config.js`.
- Deploy: `npm run deploy` (publica `dist` en `gh-pages`).

## Notas
- Si un cliente no existe en la API se muestra como "Cliente desconocido".
