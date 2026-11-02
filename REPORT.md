# REPORT — Studio Riff

## 1. Mesure d'une requête

Requête : le planning de `room-1` sur une semaine (`db/perf/planning.sql`), c'est-à-dire la requête de `GET /rooms/:id/bookings`.
Données : 100 000 réservations générées par `db/perf/generate.sql`, plus les 4 de départ, puis `ANALYZE`.

### Avant l'index

```
                                                                                                     QUERY PLAN                                                                                                      
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=3399.17..3410.05 rows=4353 width=59) (actual time=12.785..12.788 rows=91 loops=1)
   Sort Key: start_at
   Sort Method: quicksort  Memory: 32kB
   ->  Seq Scan on bookings  (cost=0.00..3136.08 rows=4353 width=59) (actual time=5.859..12.739 rows=91 loops=1)
         Filter: ((start_at < '2028-03-08 00:00:00+00'::timestamp with time zone) AND (end_at > '2028-03-01 00:00:00+00'::timestamp with time zone) AND (room_id = 'room-1'::text) AND (status = 'confirmed'::text))
         Rows Removed by Filter: 99913
 Planning Time: 2.088 ms
 Execution Time: 13.135 ms
(8 rows)

```

### Après l'index `bookings_room_start (room_id, start_at)`

```
                                                                QUERY PLAN                                                                
------------------------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=1656.30..1667.18 rows=4353 width=59) (actual time=1.654..1.656 rows=91 loops=1)
   Sort Key: start_at
   Sort Method: quicksort  Memory: 32kB
   ->  Bitmap Heap Scan on bookings  (cost=145.41..1393.21 rows=4353 width=59) (actual time=1.607..1.631 rows=91 loops=1)
         Recheck Cond: ((room_id = 'room-1'::text) AND (start_at < '2028-03-08 00:00:00+00'::timestamp with time zone))
         Filter: ((end_at > '2028-03-01 00:00:00+00'::timestamp with time zone) AND (status = 'confirmed'::text))
         Rows Removed by Filter: 5526
         Heap Blocks: exact=255
         ->  Bitmap Index Scan on bookings_room_start  (cost=0.00..144.32 rows=5590 width=0) (actual time=0.195..0.195 rows=5617 loops=1)
               Index Cond: ((room_id = 'room-1'::text) AND (start_at < '2028-03-08 00:00:00+00'::timestamp with time zone))
 Planning Time: 0.463 ms
 Execution Time: 1.716 ms
(12 rows)

```

### Analyse

- **Avant :** `Seq Scan`. PostgreSQL lit les 100 004 lignes, puis en jette 99 913 (`Rows Removed by Filter`) pour garder les 91 réservations de la semaine.
- **Après :** `Bitmap Index Scan on bookings_room_start`. L'index permet de lire seulement les lignes de `room-1` qui commencent avant la fin de la semaine (environ 5 600). Le filtre sur `end_at` et `status` n'en jette plus que 5 526.
- **Ordre des colonnes :** `room_id` est comparé par égalité, donc en premier. `start_at` est comparé par plage, donc en second.
- **Conclusion :** le temps reste de l'ordre de la milliseconde, car la table est petite. Ce qui compte, c'est l'écart entre les plans : sans index, le coût grandit avec toute la table ; avec l'index, il dépend seulement des réservations de la salle.
