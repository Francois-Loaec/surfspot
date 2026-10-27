"""Ajoute les spots de démonstration manquants au démarrage."""

import unicodedata

from .database import get_connection


DEMO_SPOTS = [
    ("La Côte des Basques", "Biarritz, France", "Démo : 1,2 m", "Démo : Ouest 12 km/h", "Démonstration uniquement — non actualisée"),
    # Garder le nom déjà utilisé dans la base évite de créer un doublon.
    ("Hossegor - La Gravière", "Hossegor, France", "Démo : 1,8 m", "Démo : Nord-Ouest 15 km/h", "Démonstration uniquement — non actualisée"),
    ("Les Cavaliers", "Anglet, France", "Démo : 1,0 m", "Démo : Ouest 8 km/h", "Démonstration uniquement — non actualisée"),
    ("Hossegor — La Nord", "Hossegor, France", "Démo : 1,4 m", "Démo : Ouest 10 km/h", "Démonstration uniquement — non actualisée"),
    ("Seignosse — Les Estagnots", "Seignosse, Landes", "Démo : 1,3 m", "Démo : Nord-Ouest 11 km/h", "Démonstration uniquement — non actualisée"),
    ("Seignosse — Les Bourdaines", "Seignosse, Landes", "Démo : 1,1 m", "Démo : Ouest 9 km/h", "Démonstration uniquement — non actualisée"),
    ("Capbreton — La Piste", "Capbreton, Landes", "Démo : 1,5 m", "Démo : Nord-Ouest 13 km/h", "Démonstration uniquement — non actualisée"),
    ("Mimizan-Plage", "Mimizan, Landes", "Démo : 1,0 m", "Démo : Ouest 8 km/h", "Démonstration uniquement — non actualisée"),
    ("Biscarrosse-Plage", "Biscarrosse, Landes", "Démo : 1,2 m", "Démo : Ouest 10 km/h", "Démonstration uniquement — non actualisée"),
    ("Lacanau-Océan", "Lacanau, Gironde", "Démo : 1,3 m", "Démo : Nord-Ouest 12 km/h", "Démonstration uniquement — non actualisée"),
    ("Le Porge", "Le Porge, Gironde", "Démo : 1,1 m", "Démo : Ouest 9 km/h", "Démonstration uniquement — non actualisée"),
    ("Carcans-Plage", "Carcans, Gironde", "Démo : 1,0 m", "Démo : Ouest 8 km/h", "Démonstration uniquement — non actualisée"),
    ("Hourtin-Plage", "Hourtin, Gironde", "Démo : 1,2 m", "Démo : Nord-Ouest 10 km/h", "Démonstration uniquement — non actualisée"),
    ("Le Grand Crohot", "Cap Ferret, Gironde", "Démo : 1,4 m", "Démo : Ouest 11 km/h", "Démonstration uniquement — non actualisée"),
    ("La Côte Sauvage", "Près de La Tremblade, Charente-Maritime", "Démo : 1,5 m", "Démo : Nord-Ouest 12 km/h", "Démonstration uniquement — non actualisée"),
    ("Les Grenettes", "Île de Ré, Charente-Maritime", "Démo : 0,9 m", "Démo : Ouest 7 km/h", "Démonstration uniquement — non actualisée"),
    ("La Sauzaie", "Brétignolles-sur-Mer, Vendée", "Démo : 1,2 m", "Démo : Ouest 9 km/h", "Démonstration uniquement — non actualisée"),
    ("Bud Bud", "Longeville-sur-Mer, Vendée", "Démo : 1,1 m", "Démo : Nord-Ouest 8 km/h", "Démonstration uniquement — non actualisée"),
    ("La Torche", "Finistère", "Démo : 1,4 m", "Démo : Ouest 12 km/h", "Démonstration uniquement — non actualisée"),
    ("Guidel-Plages", "Morbihan", "Démo : 1,0 m", "Démo : Ouest 8 km/h", "Démonstration uniquement — non actualisée"),
    ("Le Minou", "Près de Brest, Finistère", "Démo : 1,3 m", "Démo : Nord-Ouest 10 km/h", "Démonstration uniquement — non actualisée"),
    ("La Palue", "Presqu'île de Crozon, Finistère", "Démo : 1,2 m", "Démo : Ouest 9 km/h", "Démonstration uniquement — non actualisée"),
]


def _normalize_identity(value: str) -> str:
    """Ignore accents, casse et ponctuation pour reconnaître les variantes."""
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(character for character in decomposed if character.isalnum())


def _spot_key(name: str, location: str) -> tuple[str, str]:
    return _normalize_identity(name), _normalize_identity(location)


def seed_spots() -> None:
    """Ajoute chaque spot absent sans toucher aux spots déjà enregistrés."""
    with get_connection() as connection:
        # Verrouille les écritures concurrentes pendant la vérification et
        # l'insertion : deux démarrages ne peuvent pas ajouter le même spot.
        connection.execute("BEGIN IMMEDIATE")
        existing = {
            _spot_key(row["name"], row["location"])
            for row in connection.execute("SELECT name, location FROM spots")
        }
        missing = []
        for spot in DEMO_SPOTS:
            key = _spot_key(spot[0], spot[1])
            if key not in existing:
                missing.append(spot)
                existing.add(key)

        connection.executemany(
            """
            INSERT INTO spots (name, location, wave_height, wind, conditions)
            VALUES (?, ?, ?, ?, ?)
            """,
            missing,
        )
