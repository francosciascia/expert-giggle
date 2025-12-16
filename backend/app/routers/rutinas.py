import io
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select, func
from fpdf import FPDF

from app.database import get_session
from app.models import (
    DiaSemana,
    Ejercicio,
    EjercicioCreate,
    EjercicioRead,
    Rutina,
    RutinaCreate,
    RutinaList,
    RutinaListResponse,
    RutinaRead,
    RutinaUpdate,
)

router = APIRouter()


def _get_ejercicio_count(session: Session, rutina_id: int) -> int:
    statement = select(func.count(Ejercicio.id)).where(Ejercicio.rutina_id == rutina_id)
    result = session.exec(statement)
    value = result.first()
    # Depending on SQLAlchemy version, first() can return a scalar int or a Row
    if value is None:
        return 0
    return int(value[0]) if isinstance(value, (list, tuple)) else int(value)


def _generate_copy_name(session: Session, base_name: str) -> str:
    """Return a unique copy name based on the original routine name."""
    candidate = f"{base_name} (copia)"
    suffix = 2
    while session.exec(select(Rutina).where(Rutina.nombre == candidate)).first():
        candidate = f"{base_name} (copia {suffix})"
        suffix += 1
    return candidate


def _get_rutina_con_ejercicios(session: Session, rutina_id: int) -> Rutina | None:
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        return None
    ejercicios = session.exec(
        select(Ejercicio)
        .where(Ejercicio.rutina_id == rutina.id)
        .order_by(Ejercicio.dia_semana, Ejercicio.orden)
    ).all()
    rutina.ejercicios = ejercicios
    return rutina


def _wrap_long_text(text: str, max_chunk: int = 60) -> str:
    """Ensure there are breakpoints to avoid FPDF 'Not enough horizontal space'."""
    if len(text) <= max_chunk:
        return text
    parts = []
    for i in range(0, len(text), max_chunk):
        parts.append(text[i : i + max_chunk])
    return " ".join(parts)


def _export_pdf(rutina: Rutina) -> StreamingResponse:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, rutina.nombre, ln=1)
    pdf.set_font("Arial", "", 11)
    descr = _wrap_long_text(rutina.descripcion or "Sin descripción", max_chunk=60)
    usable_width = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.multi_cell(usable_width, 8, descr)
    pdf.ln(2)
    pdf.set_font("Arial", "B", 11)
    pdf.cell(0, 8, "Ejercicios", ln=1)
    pdf.set_font("Arial", "", 10)
    if rutina.ejercicios:
        for ejercicio in rutina.ejercicios:
            line = f"{ejercicio.dia_semana} · {ejercicio.nombre} · {ejercicio.series}x{ejercicio.repeticiones}"
            if ejercicio.peso is not None:
                line += f" · Peso: {ejercicio.peso}"
            if ejercicio.orden is not None:
                line += f" · Orden: {ejercicio.orden}"
            if ejercicio.notas:
                line += f" · Notas: {ejercicio.notas}"
            safe_line = _wrap_long_text(line, max_chunk=50)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(usable_width, 7, safe_line)
    else:
        pdf.cell(0, 7, "Sin ejercicios", ln=1)

    pdf_bytes = pdf.output(dest="S")
    if isinstance(pdf_bytes, str):
        pdf_bytes = pdf_bytes.encode("latin-1")
    filename = f"rutina_{rutina.id}_{datetime.utcnow().date()}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename=\"{filename}\"'},
    )


class EjercicioOrdenItem(BaseModel):
    id: int
    orden: int


class ReordenEjerciciosPayload(BaseModel):
    items: List[EjercicioOrdenItem]


@router.get("/", response_model=RutinaListResponse)
def listar_rutinas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    dia_semana: DiaSemana | None = Query(None),
    ejercicio_nombre: str | None = Query(None, min_length=1),
    session: Session = Depends(get_session),
):
    base_query = select(Rutina)
    if dia_semana is not None or ejercicio_nombre:
        base_query = base_query.join(Ejercicio)
    if dia_semana is not None:
        base_query = base_query.where(Ejercicio.dia_semana == dia_semana)
    if ejercicio_nombre:
        base_query = base_query.where(func.lower(Ejercicio.nombre).contains(ejercicio_nombre.lower()))
    base_query = base_query.distinct()

    total_subquery = base_query.subquery()
    total = session.exec(select(func.count()).select_from(total_subquery)).one()

    statement = base_query.offset(skip).limit(limit)
    rutinas = session.exec(statement).all()

    items: List[RutinaList] = []
    for rutina in rutinas:
        count = _get_ejercicio_count(session, rutina.id)
        items.append(
            RutinaList(
                id=rutina.id,
                nombre=rutina.nombre,
                descripcion=rutina.descripcion,
                fecha_creacion=rutina.fecha_creacion,
                total_ejercicios=count,
            )
        )
    return RutinaListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/buscar", response_model=RutinaListResponse)
def buscar_rutinas(
    nombre: str = Query(..., min_length=1),
    dia_semana: DiaSemana | None = Query(None),
    ejercicio_nombre: str | None = Query(None, min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    session: Session = Depends(get_session),
):
    base_query = select(Rutina).where(func.lower(Rutina.nombre).contains(nombre.lower()))
    if dia_semana is not None or ejercicio_nombre:
        base_query = base_query.join(Ejercicio)
    if dia_semana is not None:
        base_query = base_query.where(Ejercicio.dia_semana == dia_semana)
    if ejercicio_nombre:
        base_query = base_query.where(func.lower(Ejercicio.nombre).contains(ejercicio_nombre.lower()))
    base_query = base_query.distinct()

    total_subquery = base_query.subquery()
    total = session.exec(select(func.count()).select_from(total_subquery)).one()

    statement = base_query.offset(skip).limit(limit)
    rutinas = session.exec(statement).all()

    items: List[RutinaList] = []
    for rutina in rutinas:
        count = _get_ejercicio_count(session, rutina.id)
        items.append(
            RutinaList(
                id=rutina.id,
                nombre=rutina.nombre,
                descripcion=rutina.descripcion,
                fecha_creacion=rutina.fecha_creacion,
                total_ejercicios=count,
            )
        )
    return RutinaListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{rutina_id}", response_model=RutinaRead)
def obtener_rutina(rutina_id: int, session: Session = Depends(get_session)):
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")
    ejercicios = session.exec(
        select(Ejercicio).where(Ejercicio.rutina_id == rutina.id).order_by(Ejercicio.orden)
    ).all()
    rutina.ejercicios = ejercicios
    return RutinaRead.from_orm(rutina)


@router.post("/", response_model=RutinaRead, status_code=status.HTTP_201_CREATED)
def crear_rutina(rutina_data: RutinaCreate, session: Session = Depends(get_session)):
    rutina = Rutina(nombre=rutina_data.nombre, descripcion=rutina_data.descripcion)
    session.add(rutina)
    try:
        session.commit()
        session.refresh(rutina)
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Ya existe una rutina con ese nombre")

    ejercicios = []
    for ejercicio_data in rutina_data.ejercicios or []:
        ejercicio = Ejercicio(**ejercicio_data.model_dump(), rutina_id=rutina.id)
        session.add(ejercicio)
        ejercicios.append(ejercicio)
    session.commit()
    for ejercicio in ejercicios:
        session.refresh(ejercicio)

    rutina.ejercicios = ejercicios
    return RutinaRead.from_orm(rutina)


@router.put("/{rutina_id}", response_model=RutinaRead)
def actualizar_rutina(rutina_id: int, rutina_data: RutinaUpdate, session: Session = Depends(get_session)):
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    if rutina_data.nombre:
        rutina.nombre = rutina_data.nombre
    if rutina_data.descripcion is not None:
        rutina.descripcion = rutina_data.descripcion

    try:
        session.add(rutina)
        session.commit()
        session.refresh(rutina)
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Ya existe una rutina con ese nombre")

    ejercicios = session.exec(
        select(Ejercicio).where(Ejercicio.rutina_id == rutina.id).order_by(Ejercicio.orden)
    ).all()
    rutina.ejercicios = ejercicios
    return RutinaRead.from_orm(rutina)


@router.delete("/{rutina_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rutina(rutina_id: int, session: Session = Depends(get_session)):
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")
    session.delete(rutina)
    session.commit()
    return


@router.post("/{rutina_id}/ejercicios", response_model=EjercicioRead, status_code=status.HTTP_201_CREATED)
def agregar_ejercicio(rutina_id: int, ejercicio_data: EjercicioCreate, session: Session = Depends(get_session)):
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    ejercicio = Ejercicio(**ejercicio_data.model_dump(), rutina_id=rutina.id)
    session.add(ejercicio)
    session.commit()
    session.refresh(ejercicio)
    return EjercicioRead.from_orm(ejercicio)


@router.put("/{rutina_id}/ejercicios/reordenar", response_model=RutinaRead)
def reordenar_ejercicios(
    rutina_id: int, payload: ReordenEjerciciosPayload, session: Session = Depends(get_session)
):
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Debe enviar al menos un ejercicio")

    ids = [item.id for item in payload.items]
    ejercicios = session.exec(
        select(Ejercicio).where(Ejercicio.id.in_(ids), Ejercicio.rutina_id == rutina_id)
    ).all()
    if len(ejercicios) != len(payload.items):
        raise HTTPException(status_code=400, detail="Algún ejercicio no pertenece a la rutina")

    ejercicio_map = {ej.id: ej for ej in ejercicios}
    for item in payload.items:
        ejercicio = ejercicio_map[item.id]
        ejercicio.orden = item.orden
        session.add(ejercicio)

    session.commit()
    for ejercicio in ejercicios:
        session.refresh(ejercicio)

    rutina.ejercicios = session.exec(
        select(Ejercicio).where(Ejercicio.rutina_id == rutina.id).order_by(Ejercicio.dia_semana, Ejercicio.orden)
    ).all()
    return RutinaRead.from_orm(rutina)


@router.post("/{rutina_id}/duplicar", response_model=RutinaRead, status_code=status.HTTP_201_CREATED)
def duplicar_rutina(rutina_id: int, session: Session = Depends(get_session)):
    rutina = session.get(Rutina, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    ejercicios = session.exec(
        select(Ejercicio).where(Ejercicio.rutina_id == rutina.id).order_by(Ejercicio.orden)
    ).all()

    new_name = _generate_copy_name(session, rutina.nombre)
    rutina_copia = Rutina(nombre=new_name, descripcion=rutina.descripcion)
    session.add(rutina_copia)
    session.commit()
    session.refresh(rutina_copia)

    ejercicios_copia: list[Ejercicio] = []
    for ejercicio in ejercicios:
        ejercicio_copia = Ejercicio(
            nombre=ejercicio.nombre,
            dia_semana=ejercicio.dia_semana,
            series=ejercicio.series,
            repeticiones=ejercicio.repeticiones,
            peso=ejercicio.peso,
            notas=ejercicio.notas,
            orden=ejercicio.orden,
            rutina_id=rutina_copia.id,
        )
        session.add(ejercicio_copia)
        ejercicios_copia.append(ejercicio_copia)

    session.commit()
    for ejercicio in ejercicios_copia:
        session.refresh(ejercicio)

    rutina_copia.ejercicios = ejercicios_copia
    return RutinaRead.from_orm(rutina_copia)


@router.get("/{rutina_id}/export", response_class=StreamingResponse)
def exportar_rutina(
    rutina_id: int,
    formato: str = Query("pdf", pattern="^(pdf)$"),
    session: Session = Depends(get_session),
):
    rutina = _get_rutina_con_ejercicios(session, rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")
    return _export_pdf(rutina)

