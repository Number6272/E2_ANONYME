#!/bin/bash
mkdir -p backups
f=backups/studio_riff_$(date +%F_%H-%M-%S).dump
docker compose exec -T postgres pg_dump -U studio -Fc studio_riff > $f
find backups -name '*.dump' -mtime +30 -delete
echo "sauvegarde : $f"
