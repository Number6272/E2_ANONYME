# DECISIONS — Studio Riff

## 1. Où vit chaque règle

| Règle | Où | Pourquoi |
|---|---|---|
| Créneau de 1 h à 4 h, heure pleine, entre 10 h et 23 h | Domaine (`checkSlot`) + `CHECK` SQL | Règle simple, testable sans base. |
| Pas de chevauchement dans une salle | Base de données (contrainte d'exclusion) | Seule la base bloque deux requêtes qui arrivent en même temps. |
| Max 2 réservations à venir par membre | Domaine (`checkLimit`), dans une transaction avec `FOR UPDATE` sur le membre | La règle porte sur plusieurs lignes : aucune contrainte SQL ne peut l'exprimer. Le verrou empêche deux requêtes simultanées de passer. |
| Annulation : `cancelled` ou `late_cancelled` (< 24 h), pas deux fois | Domaine (`cancelStatus`) | Dépend de l'heure : l'horloge est passée en paramètre. |
| Salle en maintenance | Domaine (`checkMaintenance`) | Simple comparaison de dates sur la salle. |

Les routes HTTP ne font que lire la requête, appeler le service et renvoyer le code : 400 (requête invalide), 404 (introuvable), 409 (conflit).

## 2. Couches

```
routes.ts  →  service.ts  →  rules.ts (domaine, aucun import)
                  ↓
               repo.ts (PostgreSQL)  ·  cache.ts (Valkey)
```

Le domaine ne dépend de rien. Le container du cours relie les couches.

## 3. Modèle relationnel

```
rooms    (id PK, name, capacity, maintenance_start, maintenance_end)
members  (id PK, name)
bookings (id PK, room_id FK → rooms, member_id FK → members,
          start_at, end_at, status, cancelled_at)
```

Une salle et un membre ont plusieurs réservations.

## 4. ADR

**ADR-001 : la base empêche les chevauchements.**
Contrôler en code (SELECT puis INSERT) laisse passer deux requêtes simultanées. On utilise donc une contrainte `EXCLUDE USING gist (room_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&)` sur les réservations confirmées. `'[)'` permet d'enchaîner 18 h–20 h puis 20 h–22 h.

**ADR-002 : pas de trigger pour la limite de 2 réservations.**
Un trigger utiliserait `now()` : impossible à tester avec une horloge fixe, et la règle serait cachée dans la base. On la garde dans le domaine, et on verrouille le membre (`FOR UPDATE`) pendant la réservation.

**ADR-003 : driver `pg` avec du SQL écrit à la main, sans ORM.**
Le schéma est petit (3 tables) et le sujet demande du SQL précis : contrainte d'exclusion, `FOR UPDATE`, `EXPLAIN ANALYZE`. Un ORM cacherait ce SQL et ajouterait une couche à apprendre. Avec `pg`, chaque requête est visible et facile à expliquer. En contrepartie, on écrit soi-même la conversion ligne SQL → objet JSON.
