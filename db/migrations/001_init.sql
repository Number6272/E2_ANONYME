BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE rooms (
  id                text PRIMARY KEY,
  name              text NOT NULL,
  capacity          integer NOT NULL CHECK (capacity > 0),
  maintenance_start timestamptz,
  maintenance_end   timestamptz,
  CHECK (maintenance_end > maintenance_start)
);

CREATE TABLE members (
  id   text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE bookings (
  id           text PRIMARY KEY DEFAULT 'booking-' || gen_random_uuid(),
  room_id      text NOT NULL REFERENCES rooms(id),
  member_id    text NOT NULL REFERENCES members(id),
  start_at     timestamptz NOT NULL,
  end_at       timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('confirmed', 'cancelled', 'late_cancelled')),
  cancelled_at timestamptz,

  -- 1 h à 4 h
  CHECK (end_at - start_at BETWEEN interval '1 hour' AND interval '4 hours'),
  -- heure pleine
  CHECK (date_trunc('hour', start_at) = start_at),

  -- pas de chevauchement entre réservations confirmées d'une même salle
  CONSTRAINT no_overlap EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status = 'confirmed')
);

COMMIT;
