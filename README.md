# Proyecto Final: Restaurante App

## Descripción
App web para mostrar restaurantes, platos, pedidos y clientes.  
Backend con Node.js + MySQL en Docker, frontend con React + Vite + Bootstrap.

## Backend
- Endpoints: /restaurants, /dishes, /orders, /customers  
- Levantar backend: `docker compose up -d`  
- PhpMyAdmin: http://localhost:9091  
- API Node.js: http://localhost:4000

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

## Funcionalidades
- Lista de restaurantes con nombre y barrio  
- Detalles del restaurante: platos, pedidos y clientes  
- Interfaz responsive, actualización dinámica sin recargar

## Git
- 5 commits claros: creación frontend, Bootstrap, consumo API, correcciones RestaurantPage y clientes

## Despliegue
- GitHub Pages o servidor propio  
- Backend en Docker, frontend compilado con Vite

## Notas
- Clientes desconocidos se muestran si no existen en la API  
- Proyecto listo para entrega con toda la funcionalidad