#!/bin/bash
docker compose exec -T postgres dropdb -U studio --if-exists studio_riff_restore
docker compose exec -T postgres createdb -U studio studio_riff_restore
docker compose exec -T postgres pg_restore -U studio -d studio_riff_restore < $1
echo "restauré en $SECONDS s"
docker compose exec -T postgres psql -U studio -d studio_riff -c "SELECT count(*) AS origine FROM bookings"
docker compose exec -T postgres psql -U studio -d studio_riff_restore -c "SELECT count(*) AS restauree FROM bookings"
