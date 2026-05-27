/**
 * DDL inicial (v1). Refleja la sección 5 del spec.
 * Toda fecha se almacena como TEXT ISO 8601 con offset.
 */

export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS user_profile (
  id              INTEGER PRIMARY KEY,
  username        TEXT NOT NULL,
  first_name      TEXT,
  last_name       TEXT,
  email           TEXT,
  is_admin_global INTEGER NOT NULL DEFAULT 0,
  cached_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS markets_cache (
  id              INTEGER PRIMARY KEY,
  codigo          TEXT NOT NULL,
  nombre          TEXT NOT NULL,
  clasificacion   TEXT NOT NULL,
  direccion       TEXT,
  user_role       TEXT NOT NULL,
  cached_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id                  INTEGER PRIMARY KEY,
  client_uuid         TEXT NOT NULL UNIQUE,
  mercado_id          INTEGER NOT NULL,
  mercado_nombre      TEXT NOT NULL,
  numero_semana       INTEGER NOT NULL,
  anio                INTEGER NOT NULL,
  fecha_inicio        TEXT NOT NULL,
  fecha_fin           TEXT,
  lat_inicio          REAL,
  lng_inicio          REAL,
  accuracy_inicio     REAL,
  lat_fin             REAL,
  lng_fin             REAL,
  accuracy_fin        REAL,
  estado              TEXT NOT NULL DEFAULT 'INICIADA',
  total_productos     INTEGER NOT NULL DEFAULT 0,
  comentario_sesion   TEXT NOT NULL DEFAULT '',
  sync_state          TEXT NOT NULL DEFAULT 'synced',
  cached_at           TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_estado ON sessions(estado);
CREATE INDEX IF NOT EXISTS idx_sessions_mercado ON sessions(mercado_id);
CREATE INDEX IF NOT EXISTS idx_sessions_sync ON sessions(sync_state);

CREATE TABLE IF NOT EXISTS catalog_entries (
  session_id              INTEGER NOT NULL,
  producto_id             INTEGER NOT NULL,
  producto_nombre         TEXT NOT NULL,
  producto_categoria      TEXT NOT NULL,
  producto_orden          INTEGER NOT NULL DEFAULT 0,
  presentacion_id         INTEGER NOT NULL,
  presentacion_nombre     TEXT NOT NULL,
  presentacion_orden      INTEGER NOT NULL DEFAULT 0,
  last_price              REAL,
  umbral_inferior         REAL,
  umbral_superior         REAL,
  PRIMARY KEY (session_id, producto_id, presentacion_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_session ON catalog_entries(session_id);

CREATE TABLE IF NOT EXISTS prices (
  client_uuid                     TEXT PRIMARY KEY,
  session_id                      INTEGER NOT NULL,
  server_id                       INTEGER,
  producto_id                     INTEGER NOT NULL,
  presentacion_id                 INTEGER NOT NULL,
  precio_1                        REAL,
  precio_2                        REAL,
  precio_3                        REAL,
  precio                          REAL NOT NULL,
  observacion                     TEXT NOT NULL DEFAULT '',
  confirmado                      INTEGER NOT NULL DEFAULT 1,
  requirio_confirmacion_manual    INTEGER NOT NULL DEFAULT 0,
  variacion_porcentaje            REAL,
  client_timestamp                TEXT NOT NULL,
  sync_state                      TEXT NOT NULL DEFAULT 'pending',
  sync_attempts                   INTEGER NOT NULL DEFAULT 0,
  last_error                      TEXT,
  UNIQUE (session_id, producto_id, presentacion_id)
);

CREATE INDEX IF NOT EXISTS idx_prices_session ON prices(session_id);
CREATE INDEX IF NOT EXISTS idx_prices_sync_state ON prices(sync_state);

CREATE TABLE IF NOT EXISTS sync_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL,
  action      TEXT NOT NULL,
  status      TEXT NOT NULL,
  details     TEXT
);
`;
