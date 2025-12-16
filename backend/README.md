# Backend FastAPI

API RESTful construida con FastAPI, SQLModel y PostgreSQL para gestionar rutinas y ejercicios de gimnasio.

## Requisitos previos
- Python 3.10 o superior
- PostgreSQL 12 o superior instalado y corriendo

## Instalación
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Configuración de la Base de Datos
- Crear un archivo `.env` (puedes copiar `.env.example`).
- Variables de entorno esperadas:
  - `DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/rutinas_gimnasio`
  - Formato: `postgresql://<usuario>:<contraseña>@<host>:<puerto>/<db>`
- Crear la base de datos en PostgreSQL:
```sql
CREATE DATABASE rutinas_gimnasio;
```
- Migraciones: no hay migraciones formales; SQLModel crea las tablas al iniciar la app.

## Ejecución
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```
- Puerto por defecto: `8000`
- Documentación automática:
  - Swagger: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

## Endpoints principales
- `GET /api/rutinas` (lista con filtros y paginación)
- `GET /api/rutinas/{id}`
- `GET /api/rutinas/buscar?nombre=texto`
- `POST /api/rutinas`
- `PUT /api/rutinas/{id}`
- `DELETE /api/rutinas/{id}`
- `POST /api/rutinas/{id}/ejercicios`
- `PUT /api/rutinas/{id}/ejercicios/reordenar`
- `PUT /api/ejercicios/{id}`
- `DELETE /api/ejercicios/{id}`
- `POST /api/rutinas/{id}/duplicar`
- `GET /api/rutinas/{id}/export?formato=pdf`
- Plan semanal:
  - `GET /api/plan/`
  - `PUT /api/plan/` (asignar rutina a día)
  - `DELETE /api/plan/{dia_semana}`

## Ejemplos de requests (curl)

- Crear rutina con un ejercicio:
```bash
curl -X POST http://localhost:8000/api/rutinas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Push Day",
    "descripcion": "Pecho y tríceps",
    "ejercicios": [
      {"nombre": "Press banca", "dia_semana": "Lunes", "series": 4, "repeticiones": 10, "peso": 60, "orden": 1}
    ]
  }'
```

- Listar rutinas con paginación:
```bash
curl "http://localhost:8000/api/rutinas?skip=0&limit=10"
```

- Exportar rutina a PDF:
```bash
curl -o rutina.pdf "http://localhost:8000/api/rutinas/1/export?formato=pdf"
```

## Estructura del proyecto
- `main.py`: punto de entrada, CORS y registro de routers.
- `app/`
  - `config.py`: configuración con `pydantic-settings`.
  - `database.py`: motor y dependencias de sesión.
  - `models.py`: modelos SQLModel y esquemas Pydantic.
  - `routers/`: `rutinas.py` (CRUD, duplicar, reordenar, exportar), `ejercicios.py`, `plan.py`.

