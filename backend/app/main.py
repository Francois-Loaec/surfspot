"""Point d'entrée de l'API FastAPI SurfSpot."""

from contextlib import asynccontextmanager
from datetime import date as Date

from fastapi import FastAPI, HTTPException, Response, status
from pydantic import BaseModel, Field

from .database import initialize_database
from .models import create_session, delete_session, list_sessions, list_spots
from .seed import seed_spots


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Prépare la base et les données de démonstration au démarrage."""
    initialize_database()
    seed_spots()
    yield


app = FastAPI(title="SurfSpot API", lifespan=lifespan)


class SessionCreate(BaseModel):
    """Données nécessaires pour enregistrer une session de surf."""

    date: Date
    spot_id: int = Field(gt=0)
    note: str | None = Field(default=None, max_length=1000)


@app.get("/spots")
def get_spots() -> list[dict[str, object]]:
    """Renvoie la liste des spots enregistrés."""
    return list_spots()


@app.get("/sessions")
def get_sessions() -> list[dict[str, object]]:
    """Renvoie l'historique des sessions, de la plus récente à la plus ancienne."""
    return list_sessions()


@app.post("/sessions", status_code=status.HTTP_201_CREATED)
def post_session(session: SessionCreate) -> dict[str, object]:
    """Enregistre une session liée à un spot existant."""
    created = create_session(session.date.isoformat(), session.spot_id, session.note)
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Le spot sélectionné n'existe pas.",
        )
    return created


@app.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_session(session_id: int) -> Response:
    """Supprime une session existante."""
    if session_id <= 0 or not delete_session(session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cette session n'existe pas.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
