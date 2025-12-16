from enum import Enum
from typing import List, Optional
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship


class DiaSemana(str, Enum):
    LUNES = "Lunes"
    MARTES = "Martes"
    MIERCOLES = "Miércoles"
    JUEVES = "Jueves"
    VIERNES = "Viernes"
    SABADO = "Sábado"
    DOMINGO = "Domingo"


class EjercicioBase(SQLModel):
    nombre: str = Field(min_length=1, max_length=200)
    dia_semana: DiaSemana
    series: int = Field(gt=0)
    repeticiones: int = Field(gt=0)
    peso: Optional[float] = Field(default=None, ge=0)
    notas: Optional[str] = Field(default=None, max_length=500)
    orden: Optional[int] = Field(default=0, ge=0)


class Ejercicio(EjercicioBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rutina_id: int = Field(foreign_key="rutina.id", ondelete="CASCADE")

    rutina: Optional["Rutina"] = Relationship(back_populates="ejercicios")


class EjercicioCreate(EjercicioBase):
    pass


class EjercicioRead(EjercicioBase):
    id: int
    rutina_id: int


class EjercicioUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=200)
    dia_semana: Optional[DiaSemana] = None
    series: Optional[int] = Field(default=None, gt=0)
    repeticiones: Optional[int] = Field(default=None, gt=0)
    peso: Optional[float] = Field(default=None, ge=0)
    notas: Optional[str] = Field(default=None, max_length=500)
    orden: Optional[int] = Field(default=None, ge=0)


class RutinaBase(SQLModel):
    nombre: str = Field(min_length=1, max_length=200, unique=True)
    descripcion: Optional[str] = Field(default=None, max_length=1000)


class Rutina(RutinaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)

    ejercicios: List[Ejercicio] = Relationship(
        back_populates="rutina", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class RutinaCreate(RutinaBase):
    ejercicios: Optional[List[EjercicioCreate]] = Field(default_factory=list)


class RutinaRead(RutinaBase):
    id: int
    fecha_creacion: datetime
    ejercicios: List[EjercicioRead] = Field(default_factory=list)


class RutinaUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)


class RutinaList(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    fecha_creacion: datetime
    total_ejercicios: int = 0


class RutinaListResponse(SQLModel):
    items: List[RutinaList]
    total: int
    skip: int
    limit: int


class PlanSemanal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    dia_semana: DiaSemana = Field(unique=True, index=True)
    rutina_id: int = Field(foreign_key="rutina.id")

    rutina: Optional[Rutina] = Relationship()


class PlanDiaRead(SQLModel):
    dia_semana: DiaSemana
    rutina_id: Optional[int] = None
    rutina_nombre: Optional[str] = None


class PlanDiaUpdate(SQLModel):
    dia_semana: DiaSemana
    rutina_id: int