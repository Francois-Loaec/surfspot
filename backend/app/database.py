"""Connexion SQLite et création de la table des spots."""

import sqlite3
from pathlib import Path

# La base se trouve dans backend/data/surfspot.db, quel que soit le dossier
# depuis lequel on lance le serveur.
BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
DATABASE_PATH = DATA_DIR / "surfspot.db"


def get_connection() -> sqlite3.Connection:
    """Ouvre une connexion SQLite et configure les résultats en dictionnaires."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    """Crée la table si elle n'existe pas encore."""
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS spots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                wave_height TEXT NOT NULL,
                wind TEXT NOT NULL,
                conditions TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spot_id INTEGER NOT NULL,
                session_date TEXT NOT NULL,
                note TEXT CHECK (note IS NULL OR length(note) <= 1000),
                FOREIGN KEY (spot_id) REFERENCES spots (id) ON DELETE RESTRICT
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_sessions_date
            ON sessions (session_date DESC, id DESC)
            """
        )
