"""Fonctions simples pour lire les spots enregistrés dans SQLite."""

from .database import get_connection


def list_spots() -> list[dict[str, object]]:
    """Renvoie tous les spots sous forme de dictionnaires."""
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, name, location, wave_height, wind, conditions
            FROM spots
            ORDER BY id
            """
        ).fetchall()

    return [dict(row) for row in rows]


def list_sessions() -> list[dict[str, object]]:
    """Renvoie l'historique avec le spot associé, du plus récent au plus ancien."""
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                sessions.id,
                sessions.session_date AS date,
                sessions.spot_id,
                sessions.note,
                spots.name AS spot_name,
                spots.location AS spot_location
            FROM sessions
            JOIN spots ON spots.id = sessions.spot_id
            ORDER BY sessions.session_date DESC, sessions.id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


def create_session(session_date: str, spot_id: int, note: str | None) -> dict[str, object] | None:
    """Crée une session si le spot existe et renvoie la session avec son spot."""
    normalized_note = note.strip() if note and note.strip() else None
    with get_connection() as connection:
        spot = connection.execute(
            "SELECT id FROM spots WHERE id = ?",
            (spot_id,),
        ).fetchone()
        if spot is None:
            return None

        cursor = connection.execute(
            """
            INSERT INTO sessions (spot_id, session_date, note)
            VALUES (?, ?, ?)
            """,
            (spot_id, session_date, normalized_note),
        )
        row = connection.execute(
            """
            SELECT
                sessions.id,
                sessions.session_date AS date,
                sessions.spot_id,
                sessions.note,
                spots.name AS spot_name,
                spots.location AS spot_location
            FROM sessions
            JOIN spots ON spots.id = sessions.spot_id
            WHERE sessions.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)


def delete_session(session_id: int) -> bool:
    """Supprime une session par son identifiant, sans toucher au spot."""
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM sessions WHERE id = ?",
            (session_id,),
        )

    return cursor.rowcount > 0
