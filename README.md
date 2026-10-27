
SurfSpot

Présentation

SurfSpot est une application web qui permet aux surfeurs de consulter des spots, de découvrir leurs conditions de surf et de conserver un historique de leurs sessions.

Objectifs

Proposer une interface simple et agréable.

Consulter les informations de plusieurs spots.

Enregistrer et consulter ses sessions de surf.

Gérer une liste de spots favoris.

Fonctionnalités principales

Afficher une liste de spots avec leur nom, leur localisation et leurs conditions de démonstration.

Afficher le détail d'un spot : hauteur des vagues, vent et conditions générales.

Ajouter une session de surf avec une date, un spot et une note personnelle.

Consulter et supprimer ses sessions.

Ajouter ou retirer un spot des favoris.

Architecture technique

Frontend : React.

Backend : Python avec FastAPI.

Base de données : SQLite.

Conteneurisation : Docker et Docker Compose.

Contraintes

Application utilisable en local.

Code simple, organisé et documenté.

Données de démonstration pour les conditions de surf.

Pas de compte utilisateur dans la première version.

Pas d'API météo externe dans la première version.

Critères de réussite

L'application démarre correctement en local.

Les spots sont affichés.

Les sessions peuvent être ajoutées, consultées et supprimées.

Les favoris sont conservés.

Les données enregistrées persistent après le redémarrage.

Les composants fonctionnent avec Docker Compose.