# Studio Riff — API de réservation

API qui gère les réservations des 4 salles de répétition de l'association Studio Riff.
Node.js + TypeScript + Fastify, PostgreSQL 17 pour les données, Valkey pour le cache.

## Prérequis

- Node.js 20.6 ou plus
- Docker Desktop lancé
- Le port 5432 libre (arrêter un PostgreSQL local s'il y en a un)

## Démarrer

```bash
cp .env.example .env
docker compose up -d --wait
npm install
npm run migrate
npm run seed
npm run dev
```

L'API répond sur http://localhost:3000. Exemple : `curl localhost:3000/rooms`

## Lancer les tests

```bash
npm test
```

Les tests remettent les données de départ avant chaque test.

## Routes

| Méthode | Route | Codes |
|---|---|---|
| GET | `/rooms` | 200 |
| GET | `/rooms/:id/bookings?from=…&to=…` | 200, 400, 404 |
| POST | `/rooms/:id/bookings` | 201 + Location, 400, 404, 409 |
| GET | `/bookings/:id` | 200, 404 |
| DELETE | `/bookings/:id` | 204, 404, 409 |
| GET | `/members/:id/bookings` | 200, 404 |

## Sauvegarder et restaurer

```bash
./backup.sh
./restore.sh backups/<fichier>.dump
```

`restore.sh` restaure dans une nouvelle base `studio_riff_restore` et compare le nombre de réservations des deux côtés.

## Mesurer la requête du planning

```bash
docker compose exec -T postgres psql -U studio -d studio_riff < db/perf/generate.sql
docker compose exec -T postgres psql -U studio -d studio_riff < db/perf/planning.sql
```

## Repartir de zéro

```bash
docker compose down -v
docker compose up -d --wait
npm run migrate
npm run seed
```

## Documents

- `DECISIONS.md` : où vit chaque règle métier, couches, modèle, ADR
- `REPORT.md` : mesures avant et après index, cache Valkey, sauvegarde, RPO, RTO et rétention
