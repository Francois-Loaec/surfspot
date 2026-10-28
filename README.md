# SurfSpot

SurfSpot est une application web destinée aux surfeurs. Elle aide à découvrir des spots, à consulter leurs repères habituels et les prévisions disponibles, puis à enregistrer un historique de sessions.

## Fonctionnalités

- Liste des spots avec leur nom, leur localisation et les informations disponibles.
- Fiches détaillées avec description, niveau conseillé, conditions habituelles et prévisions marines et météo.
- Photos locales des spots accompagnées de crédits lorsqu'ils sont requis; un emplacement neutre est affiché lorsqu'aucune photo n'est disponible.
- Favoris conservés localement dans le navigateur.
- Création, consultation et suppression de sessions avec date, spot et note personnelle facultative.
- États de chargement, d'erreur et de données météo incomplètes.

## Architecture

- **React et Vite** construisent et affichent l'interface dans le navigateur. En développement, Vite transmet les appels `/api` au backend local.
- **Express 5** fournit l'API, valide les entrées, sert le frontend compilé en production et communique avec les services externes.
- **PostgreSQL** conserve les spots de démonstration et les sessions. Le backend reçoit sa chaîne de connexion via la variable d'environnement `DATABASE_URL`.

Les spots et les sessions sont chargés depuis l'API Express. Lors de son démarrage, le backend initialise le schéma PostgreSQL et les spots de démonstration sans créer de doublons. Le pool PostgreSQL est limité à quatre connexions.

## Prévisions Open-Meteo

Pour une fiche de spot, le backend interroge l'API marine Open-Meteo et son API météo (modèle Météo-France via Open-Meteo). Les prévisions peuvent inclure hauteur, période et direction des vagues et de la houle, ainsi que vitesse et direction du vent. La réponse indique la source, les heures de validité et de récupération, et l'état de disponibilité. Les valeurs manquantes restent absentes; une réponse partielle est signalée. Le cache serveur dure 15 minutes.

Ces valeurs sont des **prévisions calculées par des modèles**, pas des mesures en direct sur la plage. Les coordonnées utilisées représentent des points côtiers et peuvent être approximatives par rapport au pic de surf local. La source et l'attribution Open-Meteo sont indiquées dans les fiches.

## Lancement local

PostgreSQL doit être installé ou démarré séparément et accessible depuis la machine. Le dépôt ne fournit pas de fichier Docker Compose ni de `.env.example`. Le backend lit `DATABASE_URL` depuis l'environnement; ne placez pas sa valeur dans un fichier suivi par Git.

Dans un premier terminal (exemple pour le zsh sur macOS), depuis la racine du dépôt :

```sh
cd backend/express
npm ci
read -s "DATABASE_URL?Saisir DATABASE_URL (entrée masquée) : "
export DATABASE_URL
npm start
```

Saisissez à l'invite la chaîne de connexion fournie pour votre PostgreSQL local, puis validez. La saisie est masquée. Le serveur initialise le schéma et les spots de démonstration, puis écoute sur le port `3000`. Pour vérifier l'API et sa connexion à PostgreSQL, ouvrez `http://127.0.0.1:3000/api/health`; une réponse saine est `{"status":"ok"}`.

Dans un second terminal, depuis la racine du dépôt :

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Ouvrez l'adresse affichée par Vite, normalement `http://127.0.0.1:5173/surfspot/`. Si le port est déjà utilisé, Vite peut en choisir un autre. Son proxy envoie les appels `/api` au backend sur le port `3000`.

## Tests automatisés

Depuis `backend/express/`, lancez :

```sh
npm test
```

Cette commande utilise le module intégré `node:test`. Les tests couvrent la table des coordonnées, la normalisation des prévisions et des valeurs manquantes, le cache et la déduplication des appels, les réponses partielles et timeouts, ainsi que le gestionnaire et les erreurs de la route des prévisions. Ils n'exécutent pas un parcours complet de l'interface avec une vraie base PostgreSQL.

## Site déployé

[Ouvrir SurfSpot](https://node219697-ihme26.jcloud.ik-server.com/surfspot/)

## Limites connues

- Les prévisions proviennent de modèles et ne sont pas des observations mesurées sur le spot; leur précision locale dépend de la couverture du modèle et des coordonnées de référence.
- Les prévisions peuvent être partielles ou indisponibles si le fournisseur ne répond pas.
- Les favoris sont enregistrés dans le stockage local du navigateur : ils ne sont pas synchronisés entre appareils.
- L'application ne gère pas de comptes utilisateurs. Les sessions enregistrées dans PostgreSQL ne sont pas associées à un compte individuel.
