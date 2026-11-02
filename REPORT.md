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
