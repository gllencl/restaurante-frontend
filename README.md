# Proyecto Final: Restaurante App

## Descripción
App web para mostrar restaurantes, platos, pedidos y clientes.  
Backend con Node.js + MySQL en Docker, frontend con React + Vite + Bootstrap.

## Backend
- Endpoints: /restaurants, /dishes, /orders, /customers  
- Levantar backend: `docker compose up -d`  
- PhpMyAdmin: http://localhost:9091  
- API Node.js (local): http://localhost:4000
- API Node.js (servidor): http://51.210.22.156:4000

## Frontend
- Vite + React + Bootstrap  
- Routing con React Router  
- Estructura:
  - /pages/Home.jsx → lista de restaurantes
  - /pages/RestaurantPage.jsx → detalles restaurante
  - /components/RestaurantList.jsx → lista restaurantes
  - /services/api.js → funciones API
- Levantar frontend: `npm install` y `npm run dev`  
- URL: http://localhost:5173
- Configurar API: crear `.env` con `VITE_API_URL=http://localhost:4000` para local, o usar el servidor remoto (por defecto).

## Funcionalidades
- Lista de restaurantes con nombre y barrio  
- Detalles del restaurante: platos, pedidos y clientes  
- Interfaz responsive, actualización dinámica sin recargar

## Cambios recientes (frontend)
- UI profesional de pedidos por cliente con tarjetas y panel de detalle  
- Filtros por cliente/pedido, rango de fechas y ordenación  
- Exportación a Excel  
- Platos en formato carta con categorías y orden personalizado  
- Mejoras visuales y de usabilidad (chevrons, resaltado de búsqueda)

## Git
- 5 commits claros: creación frontend, Bootstrap, consumo API, correcciones RestaurantPage y clientes

## Despliegue
- GitHub Pages o servidor propio  
- Backend en Docker, frontend compilado con Vite  
- En GitHub Pages: el `base` ya está configurado en `vite.config.js` para `/restaurante-frontend/`.
- URL GitHub Pages: https://gllencl.github.io/restaurante-frontend/

### Pasos GitHub Pages
1. `npm install`
2. `npm run deploy`  
   (Esto hace build y publica la carpeta `dist` en la rama `gh-pages`)
3. En GitHub: Settings → Pages → Source: `gh-pages` / root

## Notas
- Clientes desconocidos se muestran si no existen en la API  
- Proyecto listo para entrega con toda la funcionalidad
