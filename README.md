# Sistema de Gestión de Rutinas de Gimnasio
Proyecto final de Programación IVfullstack para administrar rutinas y ejercicios: frontend en React + Vite (Material UI) y backend en FastAPI + SQLModel conectado a PostgreSQL. Incluye plan semanal, duplicado de rutinas, reordenamiento drag & drop y exportación de rutina en PDF.

## Características principales
- CRUD de rutinas con ejercicios asociados.
- Búsqueda, filtros por día y tipo de ejercicio, y paginación.
- Reordenamiento de ejercicios por drag & drop dentro de cada día.
- Duplicar rutinas completas.
- Exportar cada rutina a PDF.
- Plan semanal (asignar rutina a cada día).
- Documentación Swagger y ReDoc en el backend.

## Estructura
- `backend/`: API RESTful FastAPI/SQLModel (PostgreSQL). Ver `backend/README.md` para instalación, configuración y endpoints.
- `frontend/`: SPA Vite + React + MUI. Ver `frontend/README.md` para instalación, configuración y comandos.

## Requisitos previos
- Python 3.10+ y PostgreSQL 12+ (para el backend).
- Node.js 18+ y npm/yarn (para el frontend).

## Pasos rápidos
1) Backend  
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
Doc: Swagger en `http://localhost:8000/docs`

2) Frontend  
```bash
cd frontend
npm install
npm run dev
```
App en `http://localhost:5173/`

