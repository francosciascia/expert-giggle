from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import ejercicios_router, rutinas_router
from app.routers.plan import router as plan_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Sistema de Gestión de Rutinas",
    description="API RESTful para administrar rutinas de entrenamiento y ejercicios",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rutinas_router, prefix="/api/rutinas", tags=["Rutinas"])
app.include_router(ejercicios_router, prefix="/api/ejercicios", tags=["Ejercicios"])
app.include_router(plan_router, prefix="/api/plan", tags=["Plan Semanal"])


@app.get("/", tags=["Raiz"])
def root():
    return {"message": "Sistema de Gestión de Rutinas"}


@app.get("/health", tags=["Raiz"])
def health_check():
    return {"status": "ok"}

