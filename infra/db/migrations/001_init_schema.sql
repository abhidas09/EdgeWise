-- =========================
-- Edgewise v1 Database Schema
-- Postgres DDL
-- =========================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- USERS + SETTINGS
-- -------------------------
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE user_settings (
  user_id            uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timezone           text NOT NULL DEFAULT 'America/Los_Angeles',
  risk_profile       text NOT NULL DEFAULT 'medium'
                     CHECK (risk_profile IN ('low','medium','high')),
  default_stake      numeric,
  sports_preferences jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- -------------------------
-- SUBSCRIPTIONS (STRIPE)
-- -------------------------
CREATE TABLE subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text UNIQUE,
  plan                   text NOT NULL DEFAULT 'free'
                         CHECK (plan IN ('free','pro','elite')),
  status                 text NOT NULL DEFAULT 'active',
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- -------------------------
-- SPORTS CATALOG (NBA MVP)
-- -------------------------
CREATE TABLE sports (
  id   smallint PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_code text NOT NULL,
  team_key    text NOT NULL UNIQUE,
  name        text NOT NULL,
  abbrev      text NOT NULL
);

CREATE TABLE players (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_code text NOT NULL,
  player_key  text NOT NULL UNIQUE,
  name        text NOT NULL,
  team_id     uuid REFERENCES teams(id),
  position    text
);

-- -------------------------
-- SPORTSBOOKS + MARKETS
-- -------------------------
CREATE TABLE sportsbooks (
  id        smallint PRIMARY KEY,
  key       text NOT NULL UNIQUE,
  name      text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE markets (
  id           smallint PRIMARY KEY,
  sport_code   text NOT NULL,
  key          text NOT NULL,
  display_name text NOT NULL,
  unit         text,
  UNIQUE (sport_code, key)
);

-- -------------------------
-- EVENTS / GAMES
-- -------------------------
CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_code   text NOT NULL,
  league_code  text NOT NULL,
  start_time   timestamptz NOT NULL,
  home_team_id uuid NOT NULL REFERENCES teams(id),
  away_team_id uuid NOT NULL REFERENCES teams(id),
  status       text NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled','live','final','canceled','postponed')),
  external_ids jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- -------------------------
-- ODDS SNAPSHOTS + OFFERS
-- -------------------------
CREATE TABLE odds_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prop_offers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id   uuid NOT NULL REFERENCES odds_snapshots(id) ON DELETE CASCADE,
  sportsbook_id smallint NOT NULL REFERENCES sportsbooks(id),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES players(id),
  market_id     smallint NOT NULL REFERENCES markets(id),
  side          text NOT NULL CHECK (side IN ('over','under')),
  line          numeric NOT NULL,
  odds_american integer,
  odds_decimal  numeric,
  is_available  boolean NOT NULL DEFAULT true,
  offer_url     text,
  raw           jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (snapshot_id, sportsbook_id, event_id, player_id, market_id, side, line)
);

-- -------------------------
-- MODEL VERSIONING + SCORES
-- -------------------------
CREATE TABLE model_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  features_schema js_
