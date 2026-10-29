CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dataset_type TEXT NOT NULL DEFAULT 'other',
  source_organization TEXT,
  source_url TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  external_id TEXT,
  original_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  script_language TEXT,
  state TEXT,
  district TEXT,
  village TEXT,
  plot_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  boundary_geojson JSONB,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_row_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dataset_id, external_id, source_row_number)
);
CREATE INDEX IF NOT EXISTS places_normalized_name_idx ON places (normalized_name);
CREATE INDEX IF NOT EXISTS places_district_idx ON places (LOWER(district));
CREATE INDEX IF NOT EXISTS places_dataset_idx ON places (dataset_id);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  target_place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('suggested','high_confidence','medium_confidence','needs_review','approved','rejected')),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by TEXT,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_place_id <> target_place_id),
  UNIQUE(source_place_id, target_place_id)
);
CREATE INDEX IF NOT EXISTS matches_status_idx ON matches(status);
CREATE INDEX IF NOT EXISTS matches_confidence_idx ON matches(confidence DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
