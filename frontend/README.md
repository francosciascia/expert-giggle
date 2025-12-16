# Frontend React + Vite

SPA construida con Vite, React 18 y Material UI que consume la API FastAPI del backend para gestionar rutinas y ejercicios.

## Requisitos previos
- Node.js 18 o superior
- npm (o yarn)

## Instalación
```bash
cd frontend
npm install
```

## Configuración
- Backend por defecto en `http://localhost:8000`.
- Para apuntar a otro backend, crear `.env` (puedes copiar `.env.example`) y definir:
```
VITE_API_URL=http://localhost:8000
```

## Ejecución
- Modo desarrollo:
```bash
cd frontend
npm run dev
```
  Puerto por defecto: `5173`
- Build producción:
```bash
npm run build
```

## Tecnologías utilizadas
- React 18
- Vite
- React Router DOM
- Material UI (MUI)
- Axios

## Estructura del proyecto
- `src/main.jsx`: punto de entrada y montaje de la app.
- `src/App.jsx`: tema MUI, rutas y layout general.
- `src/components/Navbar.jsx`: barra de navegación global.
- `src/pages/`: vistas principales (`RutinaList`, `RutinaDetail`, `RutinaForm`, `PlanSemanal`).
- `src/services/api.js`: cliente Axios y métodos para consumir la API.