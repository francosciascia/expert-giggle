from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import DiaSemana, PlanDiaRead, PlanDiaUpdate, PlanSemanal, Rutina

router = APIRouter()


@router.get("/", response_model=list[PlanDiaRead])
def obtener_plan_semanal(session: Session = Depends(get_session)):
    entries = session.exec(select(PlanSemanal)).all()
    by_day = {entry.dia_semana: entry for entry in entries}

    result: list[PlanDiaRead] = []
    for dia in DiaSemana:
        entry = by_day.get(dia)
        if entry:
            rutina = session.get(Rutina, entry.rutina_id)
            result.append(
                PlanDiaRead(
                    dia_semana=dia,
                    rutina_id=entry.rutina_id,
                    rutina_nombre=rutina.nombre if rutina else None,
                )
            )
        else:
            result.append(PlanDiaRead(dia_semana=dia, rutina_id=None, rutina_nombre=None))
    return result


@router.put("/", response_model=PlanDiaRead)
def asignar_rutina_a_dia(payload: PlanDiaUpdate, session: Session = Depends(get_session)):
    rutina = session.get(Rutina, payload.rutina_id)
    if not rutina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rutina no encontrada")

    entry = session.exec(
        select(PlanSemanal).where(PlanSemanal.dia_semana == payload.dia_semana)
    ).first()
    if entry:
        entry.rutina_id = payload.rutina_id
        session.add(entry)
    else:
        entry = PlanSemanal(dia_semana=payload.dia_semana, rutina_id=payload.rutina_id)
        session.add(entry)

    session.commit()
    session.refresh(entry)
    return PlanDiaRead(dia_semana=entry.dia_semana, rutina_id=entry.rutina_id, rutina_nombre=rutina.nombre)


@router.delete("/{dia_semana}", status_code=status.HTTP_204_NO_CONTENT)
def limpiar_dia(dia_semana: DiaSemana, session: Session = Depends(get_session)):
    entry = session.exec(select(PlanSemanal).where(PlanSemanal.dia_semana == dia_semana)).first()
    if entry:
        session.delete(entry)
        session.commit()
    return

