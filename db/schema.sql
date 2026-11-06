CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS places (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  location geography(Point, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS places_location_idx ON places USING gist (location);
CREATE INDEX IF NOT EXISTS places_geometry_idx ON places USING gist ((location::geometry));
