# Dossier de validation — SurfSpot

Ce document décrit le comportement relevé dans le code du dépôt. Deux résultats de tests manuels en local sont rapportés par l'étudiant; ils n'ont pas été reproduits pendant cette rédaction. Le cas météo partiel/timeout a été vérifié par les tests automatisés avec un fournisseur simulé, mais pas manuellement dans Chrome. Aucun secret ni mot de passe n'est nécessaire dans ce document.

## 1. Présentation du besoin

SurfSpot s'adresse aux surfeurs qui veulent repérer des spots, consulter leurs informations habituelles et des prévisions marines, puis garder une trace de leurs sessions. Le scénario courant est de parcourir les spots, ouvrir une fiche, consulter les conditions disponibles, ajouter un spot aux favoris et enregistrer une session avec une date et une note facultative.

Les favoris sont conservés dans le stockage local du navigateur. Les sessions sont enregistrées dans PostgreSQL. Les prévisions sont des sorties de modèles météorologiques, pas des mesures prises sur la plage.

## 2. Architecture

- **Frontend React et Vite** : affiche la liste et les fiches de spots, les favoris, les sessions et les états de chargement ou d'erreur. En développement, Vite transmet `/api` à Express sur `127.0.0.1:3000`. En production, le frontend compilé est servi par Express sous `/surfspot/` et utilise `/surfspot/api`.
- **Backend Express 5** : expose l'API, valide les entrées, interroge PostgreSQL et appelle les services de prévisions. Le serveur attend l'initialisation de la base avant d'écouter sur `0.0.0.0:3000`.
- **PostgreSQL** : conserve les spots de démonstration et les sessions. La connexion est fournie par `DATABASE_URL`; le pool est limité à quatre connexions. Au démarrage, le backend crée le schéma si nécessaire et insère les spots de démonstration de façon idempotente.
- **Open-Meteo** : fournit séparément les prévisions marines et météo. Le backend met en cache les réponses pendant 15 minutes et regroupe les appels simultanés pour les mêmes coordonnées.

Trajet d'une demande de prévisions : le navigateur appelle `/api/spots/:spotId/conditions` en développement ou `/surfspot/api/spots/:spotId/conditions` en production. Express vérifie le spot et ses coordonnées, demande les champs disponibles à Open-Meteo, normalise les unités et les valeurs manquantes, puis renvoie un JSON. React affiche l'état de disponibilité, les heures de validité et de récupération, la source et l'attribution. Une réponse partielle reste affichable; une indisponibilité est présentée comme telle.

Les prévisions sont modélisées. Les coordonnées des secteurs de surf sont parfois approximatives et ne décrivent pas nécessairement un pic précis. L'interface indique leur précision et ne transforme pas une valeur absente en zéro.

Fichiers de référence : `frontend/src/api/base.js`, `frontend/vite.config.js`, `backend/express/src/app.js`, `backend/express/src/server.js`, `backend/express/src/services/openMeteo.js` et `backend/express/src/data/spotCoordinates.js`.

## 3. Modèle de données

Le schéma réellement créé par `backend/express/src/db/schema.sql` comporte deux tables :

| Table | Colonnes et contraintes principales |
|---|---|
| `spots` | `id INTEGER` identité générée, clé primaire; `name`, `location`, `wave_height`, `wind`, `conditions`, `name_key`, `location_key` en `TEXT NOT NULL`; unicité de `(name_key, location_key)` pour éviter les doublons de spots de démonstration. |
| `sessions` | `id INTEGER` identité générée, clé primaire; `spot_id INTEGER NOT NULL` référence `spots(id)` avec `ON DELETE RESTRICT`; `session_date DATE NOT NULL`; `note` nullable, limitée à 1000 caractères par une contrainte `CHECK`. |

Un index `idx_sessions_date` trie efficacement l'historique par date décroissante, puis identifiant décroissant. La relation est un-à-plusieurs : un spot peut être associé à plusieurs sessions; une session référence un spot existant. La contrainte `RESTRICT` empêche la suppression d'un spot encore utilisé.

Exemple de lecture adapté au schéma, utilisé pour joindre une session à son spot :

```sql
SELECT sessions.id,
       sessions.session_date AS date,
       sessions.spot_id,
       sessions.note,
       spots.name AS spot_name,
       spots.location AS spot_location
FROM sessions
JOIN spots ON spots.id = sessions.spot_id
ORDER BY sessions.session_date DESC, sessions.id DESC;
```

Pour les valeurs reçues de l'utilisateur, le backend utilise des paramètres PostgreSQL (`$1`, `$2`, etc.) transmis séparément de la requête SQL.

## 4. Règle métier

Lors de la création d'une session, le backend exige une date réelle au format `YYYY-MM-DD`, un `spot_id` entier positif et sûr, et une note facultative de 1000 caractères maximum. Une note vide devient `null`. Le spot doit exister; la clé étrangère PostgreSQL protège également cette relation. Une entrée invalide reçoit une réponse JSON `422`, un spot absent `404`, et une création réussie `201` avec la session créée.

La validation est faite dans `backend/express/src/routes/sessions.js`; l'insertion emploie une requête paramétrée. La contrainte de longueur de note existe aussi dans PostgreSQL, ce qui protège les données même si une requête contourne le formulaire React.

## 5. Trois cas de validation et résultats

Les deux résultats manuels ci-dessous sont rapportés par l'étudiant; ils n'ont pas été reproduits pendant cette vérification. Le troisième cas a été vérifié par des tests automatisés avec un fournisseur simulé, sans appel réseau à Open-Meteo.

### Cas normal — fiche et prévisions

**Résultat manuel rapporté : réussi.** L'étudiant a vérifié en local qu'une fiche de spot s'ouvre et que ses prévisions fonctionnent. Ce résultat couvre le parcours observé dans le navigateur, mais n'a pas été exécuté par l'agent.

### Cas d'erreur — spot inexistant

**Résultat manuel rapporté : réussi.** L'appel `GET /api/spots/999999/conditions` a renvoyé `{"detail":"Spot introuvable."}`. Le résultat a été fourni par l'étudiant et n'a pas été reproduit ici.

Pour le reproduire localement :

```sh
curl -i http://127.0.0.1:3000/api/spots/999999/conditions
```

Résultat attendu : `404` avec le JSON ci-dessus.

### Cas météo — réponse partielle et fournisseur indisponible

**Résultat automatisé : réussi.** Le test `le service conserve une réponse partielle et transforme un timeout en indisponibilité JSON` dans `backend/express/test/conditions.test.js` simule les réponses avec une fonction `fetch` locale : l'API marine renvoie les vagues tandis que l'API météo échoue, puis un scénario où la requête simulée dépasse le délai. Il vérifie que le premier cas produit `status: "partial"` avec le vent manquant à `null`, et que le timeout produit une erreur de service avec le statut `503`. Le test `la route couvre les erreurs d’identifiant, spot absent et prévision indisponible` vérifie également que la route propage le statut `503`.

Ces tests n'appellent pas Open-Meteo, ne coupent pas le service et ne vérifient pas l'affichage dans Chrome. Le cas d'une réponse partielle ou d'une panne réelle du fournisseur n'a donc pas été testé manuellement dans le navigateur.

## 6. Tests automatisés

La commande existante est `npm test`, à lancer depuis `backend/express/` (elle exécute `node --test`). **Vérification effectuée lors de cette mise à jour : 7 tests réussis, 0 échec.** Ils couvrent les coordonnées des 22 spots, la normalisation des prévisions et valeurs manquantes, le choix de l'heure de prévision, le cache et la déduplication, les réponses partielles et timeouts, ainsi que le gestionnaire et les erreurs de la route des prévisions.

Il n'existe pas de script de test frontend dans `frontend/package.json`. Les tests automatisés actuels ne remplacent pas les vérifications manuelles rapportées ci-dessus; ils ne couvrent notamment pas un parcours complet navigateur avec une base PostgreSQL réelle.

## 7. Lancement local et déploiement

### Lancement local

Le dépôt ne fournit ni Docker Compose, ni fichier `.env.example`, ni procédure locale à jour. PostgreSQL doit donc être démarré et accessible séparément. Le backend exige `DATABASE_URL`; il ne la lit pas depuis un fichier `.env` dans le code inspecté.

Dans un premier terminal, depuis la racine du dépôt :

```sh
cd backend/express
npm ci
read -s "DATABASE_URL?Saisir DATABASE_URL (entrée masquée) : "
export DATABASE_URL
npm start
```

La valeur saisie doit être l'URL de la base PostgreSQL locale fournie à l'étudiant; ne pas la mettre dans Git. Le serveur initialise le schéma et les spots de démonstration au démarrage, puis écoute sur le port 3000. Vérifier `http://127.0.0.1:3000/api/health`.

Dans un second terminal :

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Ouvrir l'adresse annoncée par Vite, normalement `http://127.0.0.1:5173/surfspot/`. Si le port 5173 est déjà pris, Vite peut annoncer un autre port. Le proxy `/api` transmet les appels à Express. Le README à la racine a été actualisé pour décrire l'architecture React, Express et PostgreSQL; les instructions ci-dessus sont cohérentes avec les scripts et la configuration actuels.

### Déploiement IHME

Le Dockerfile construit le frontend puis l'image d'exécution unique contenant le frontend compilé et Express. Le workflow `.github/workflows/publish.yml` publie l'image dans GHCR lors d'un push sur `main` ou `master`. Il ne déploie pas automatiquement à cette occasion.

Pour déclencher un déploiement : dans GitHub, ouvrir **Actions**, choisir le workflow **Construire et publier l’image**, puis **Run workflow** et activer l'option **Déployer cette version après construction**. Cette option est désactivée par défaut. Le dépôt doit avoir la variable `IHME_BASE_PATH` configurée à `/surfspot/`, la variable `IHME_DEPLOY_URL` fournie par le cours et le secret `IHME_DEPLOY_TOKEN` configuré dans les paramètres GitHub. Ne pas afficher ni inscrire la valeur du secret dans le dépôt. Le workflow construit/publie l'image, puis n'appelle le client de déploiement qu'après une exécution manuelle avec l'option activée.

En production, l'interface est sous `/surfspot/`, et les endpoints API sont accessibles sous `/surfspot/api` (les routes `/api` sont aussi montées dans Express). La route de santé vérifie réellement PostgreSQL : elle renvoie `{"status":"ok"}` uniquement si le test SQL réussit. Le serveur IHME fournit `DATABASE_URL`; aucune valeur de connexion ne doit être ajoutée au code.

## 8. Limites et améliorations possibles

- Les favoris sont propres au navigateur et ne sont pas synchronisés entre appareils; l'application ne comporte pas de compte utilisateur.
- L'historique des sessions est commun à la base, sans séparation par utilisateur ni authentification.
- Les prévisions dépendent de la disponibilité et de la couverture du fournisseur; elles sont modélisées, leur résolution locale est limitée et certaines coordonnées de spots sont approximatives.
- Les tests présents ciblent les prévisions; les routes CRUD de sessions, le démarrage complet avec PostgreSQL et les parcours d'interface restent à vérifier manuellement.

## 9. Préparation à l'oral

1. **Pourquoi séparer React et Express ?** React présente l'interface dans le navigateur; Express centralise l'accès à la base et aux services externes. Le navigateur passe par `/api`.
2. **Comment une session est-elle liée à un spot ?** `sessions.spot_id` référence `spots.id`; la clé étrangère empêche une session de pointer vers un spot inexistant.
3. **Pourquoi utiliser une requête SQL paramétrée ?** Les valeurs sont transmises séparément du texte SQL, ce qui évite de construire une requête en concaténant une entrée utilisateur.
4. **Les vagues affichées sont-elles mesurées sur la plage ?** Non. Ce sont des prévisions de modèle Open-Meteo; l'interface précise la source et les heures associées.
5. **Que vérifie `/api/health` ?** Il exécute un `SELECT 1` dans PostgreSQL; un statut sain signifie que l'application peut joindre la base à cet instant.

## Faits vérifiés et vérifications restantes

Le contenu ci-dessus a été confronté au schéma SQL, aux routes Express, au service Open-Meteo, aux composants React, aux scripts npm, au Dockerfile et au workflow du dépôt. Lors de cette mise à jour, `npm test` a été exécutée depuis `backend/express/` : sept tests ont réussi. Les deux résultats manuels de la section 5 sont rapportés par l'étudiant; le troisième cas a été simulé uniquement par les tests automatisés. Aucun appel au fournisseur, test météo manuel dans Chrome, build frontend, démarrage de serveur ou déploiement n'a été réalisé ici.
