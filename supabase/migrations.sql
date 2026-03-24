-- ╔══════════════════════════════════════════════════════════════╗
-- ║  FIB Platform — Supabase Schema Migration                   ║
-- ║  Run this in your Supabase SQL Editor                       ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  rol           TEXT NOT NULL DEFAULT 'federal_agent',
  "discordId"   TEXT,
  "agentNumber" TEXT,
  nombre        TEXT,
  callsign      TEXT,
  "createdAt"   TIMESTAMPTZ DEFAULT now(),
  activo        BOOLEAN DEFAULT true
);

-- ── Invites ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invites (
  codigo       TEXT PRIMARY KEY,
  rol          TEXT NOT NULL,
  "discordId"  TEXT,
  "agentNumber" TEXT,
  nombre       TEXT,
  "creadoPor"  TEXT NOT NULL,
  "creadoEn"   TIMESTAMPTZ DEFAULT now(),
  "maxUsos"    INTEGER DEFAULT 1,
  usos         INTEGER DEFAULT 0,
  "usadoPor"   JSONB DEFAULT '[]'::jsonb
);

-- Insert bootstrap invite if not exists
INSERT INTO invites (codigo, rol, "creadoPor", "maxUsos", usos, "usadoPor", "creadoEn")
VALUES ('indraputo0%0', 'command_staff', 'SYSTEM', 2, 0, '[]', now())
ON CONFLICT (codigo) DO NOTHING;

-- ── Casos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS casos (
  id                TEXT PRIMARY KEY,
  "numeroCaso"      TEXT NOT NULL,
  titulo            TEXT NOT NULL,
  descripcion       TEXT DEFAULT '',
  tipo              TEXT DEFAULT '',
  estado            TEXT DEFAULT 'abierto',
  prioridad         TEXT DEFAULT 'media',
  unidad            TEXT DEFAULT '',
  "agenteLead"      TEXT DEFAULT '',
  "agentesAsignados" JSONB DEFAULT '[]'::jsonb,
  sospechosos       JSONB DEFAULT '[]'::jsonb,
  evidencias        JSONB DEFAULT '[]'::jsonb,
  notas             JSONB DEFAULT '[]'::jsonb,
  timeline          JSONB DEFAULT '[]'::jsonb,
  "creadoPor"       TEXT NOT NULL,
  "creadoEn"        TIMESTAMPTZ DEFAULT now(),
  "actualizadoEn"   TIMESTAMPTZ DEFAULT now(),
  "cerradoEn"       TIMESTAMPTZ,
  clasificacion     TEXT DEFAULT 'interno'
);

-- ── Tickets ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id              TEXT PRIMARY KEY,
  "numeroTicket"  TEXT NOT NULL,
  titulo          TEXT NOT NULL,
  descripcion     TEXT DEFAULT '',
  tipo            TEXT DEFAULT 'solicitud',
  estado          TEXT DEFAULT 'abierto',
  prioridad       TEXT DEFAULT 'media',
  "creadoPor"     TEXT NOT NULL,
  "asignadoA"     TEXT,
  comentarios     JSONB DEFAULT '[]'::jsonb,
  "creadoEn"      TIMESTAMPTZ DEFAULT now(),
  "actualizadoEn" TIMESTAMPTZ DEFAULT now(),
  "resueltoPor"   TEXT,
  "resueltoEn"    TIMESTAMPTZ,
  tags            JSONB DEFAULT '[]'::jsonb
);

-- ── Allanamientos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allanamientos (
  id                    TEXT PRIMARY KEY,
  "numeroSolicitud"     TEXT NOT NULL,
  direccion             TEXT NOT NULL,
  motivacion            TEXT NOT NULL,
  descripcion           TEXT DEFAULT '',
  sospechoso            TEXT DEFAULT 'Sin identificar',
  "casoVinculado"       TEXT,
  estado                TEXT DEFAULT 'pendiente',
  "solicitadoPor"       TEXT NOT NULL,
  "nombreSolicitante"   TEXT NOT NULL,
  "callsignSolicitante" TEXT,
  unidad                TEXT DEFAULT 'General',
  "fechaSolicitud"      TIMESTAMPTZ DEFAULT now(),
  "fechaEjecucion"      TIMESTAMPTZ,
  firmas                JSONB DEFAULT '[]'::jsonb,
  "motivoDenegacion"    TEXT,
  observaciones         TEXT DEFAULT '',
  mensajes              JSONB DEFAULT '[]'::jsonb,
  "actualizadoEn"       TIMESTAMPTZ DEFAULT now()
);

-- ── Operativos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operativos (
  id              TEXT PRIMARY KEY,
  tipo            TEXT DEFAULT 'operativo',
  titulo          TEXT NOT NULL,
  descripcion     TEXT DEFAULT '',
  contenido       TEXT DEFAULT '',
  bloques         JSONB DEFAULT '[]'::jsonb,
  estado          TEXT DEFAULT 'borrador',
  clasificacion   TEXT DEFAULT 'interno',
  unidad          TEXT DEFAULT 'General',
  archivos        JSONB DEFAULT '[]'::jsonb,
  media           JSONB DEFAULT '[]'::jsonb,
  imagenes        JSONB DEFAULT '[]'::jsonb,
  "creadoPor"     TEXT NOT NULL,
  "nombreAutor"   TEXT NOT NULL,
  "creadoEn"      TIMESTAMPTZ DEFAULT now(),
  "actualizadoEn" TIMESTAMPTZ DEFAULT now(),
  "aprobadoPor"   TEXT,
  "aprobadoEn"    TIMESTAMPTZ,
  tags            JSONB DEFAULT '[]'::jsonb
);

-- ── Chat Canales ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_canales (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  descripcion     TEXT DEFAULT '',
  tipo            TEXT DEFAULT 'general',
  unidad          TEXT,
  participantes   JSONB DEFAULT '[]'::jsonb,
  acceso          JSONB DEFAULT '["*"]'::jsonb,
  "creadoEn"      TIMESTAMPTZ DEFAULT now(),
  icono           TEXT
);

-- Insert default channels
INSERT INTO chat_canales (id, nombre, descripcion, tipo, acceso, "creadoEn") VALUES
  ('general',     'general',      'Canal principal',                    'general',     '["*"]',                                                  now()),
  ('operaciones', 'operaciones',  'Coordinación operativa',             'general',     '["command_staff","supervisory","federal_agent"]',          now()),
  ('ert',         'ert',          'Canal ERT',                          'unidad',      '["*"]',                                                   now()),
  ('cirg',        'cirg',         'Canal CIRG',                         'unidad',      '["*"]',                                                   now()),
  ('rrhh',        'rrhh',         'Canal RRHH',                         'unidad',      '["*"]',                                                   now()),
  ('supervisory', 'supervisory',  'Command Staff y Supervisory',        'supervisory', '["command_staff","supervisory"]',                          now()),
  ('command',     'command-staff','Solo Command Staff',                  'comando',     '["command_staff"]',                                       now())
ON CONFLICT (id) DO NOTHING;

-- ── Config Visual ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_visual (
  id                    TEXT PRIMARY KEY DEFAULT 'singleton',
  "nombreDivision"      TEXT DEFAULT 'Federal Investigation Bureau',
  "descripcionDivision" TEXT DEFAULT 'División de investigación federal.',
  "logoUrl"             TEXT DEFAULT 'https://i.imgur.com/EAimMhx.png',
  "colorPrimario"       TEXT DEFAULT '#1B6FFF',
  "colorSidebar"        TEXT DEFAULT '#101820',
  "colorAcento"         TEXT DEFAULT '#00C4FF',
  "fondoDashboardUrl"   TEXT DEFAULT '',
  "fondoHeroUrl"        TEXT DEFAULT '',
  "fondoOpacidad"       INTEGER DEFAULT 20,
  "bannerActivo"        BOOLEAN DEFAULT false,
  "bannerTexto"         TEXT DEFAULT '',
  "bannerColor"         TEXT DEFAULT 'blue',
  "modoOscuroDefault"   BOOLEAN DEFAULT true,
  "textoHero"           TEXT DEFAULT 'Federal Investigation Bureau',
  "textoSubhero"        TEXT DEFAULT 'Sistema centralizado de gestión operativa',
  "textoMision"         TEXT DEFAULT 'Proteger la integridad del estado de derecho.',
  "divisionesInfo"      JSONB DEFAULT '[{"nombre":"CIRG","descripcion":"Critical Incident Response Group","logoUrl":"https://i.imgur.com/QKAp6O1.png"},{"nombre":"ERT","descripcion":"Evidence Response Team","logoUrl":"https://i.imgur.com/IemqOQh.png"},{"nombre":"RRHH","descripcion":"Recursos Humanos","logoUrl":"https://i.imgur.com/z5NiemF.png"}]'::jsonb,
  "actualizadoPor"      TEXT DEFAULT 'SYSTEM',
  "actualizadoEn"       TIMESTAMPTZ DEFAULT now()
);

INSERT INTO config_visual (id) VALUES ('singleton') ON CONFLICT (id) DO NOTHING;

-- ── RLS Policies (disable for service role, enable if using anon) ─
-- If using SUPABASE_SERVICE_ROLE_KEY, RLS is bypassed automatically.
-- If using anon key, uncomment and adjust these policies:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role full access" ON users USING (true);
-- (repeat for each table)

