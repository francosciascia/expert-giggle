from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.models import Ejercicio, EjercicioRead, EjercicioUpdate

router = APIRouter()


@router.put("/{ejercicio_id}", response_model=EjercicioRead)
def actualizar_ejercicio(ejercicio_id: int, ejercicio_data: EjercicioUpdate, session: Session = Depends(get_session)):
    ejercicio = session.get(Ejercicio, ejercicio_id)
    if not ejercicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado")

    update_data = ejercicio_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ejercicio, key, value)

    session.add(ejercicio)
    session.commit()
    session.refresh(ejercicio)
    return EjercicioRead.from_orm(ejercicio)


@router.delete("/{ejercicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ejercicio(ejercicio_id: int, session: Session = Depends(get_session)):
    ejercicio = session.get(Ejercicio, ejercicio_id)
    if not ejercicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejercicio no encontrado")

    session.delete(ejercicio)
    session.commit()
    return

