CREATE TABLE invitations (
  token TEXT PRIMARY KEY,
  relm TEXT,
  uses INTEGER DEFAULT 1,
  used INTEGER DEFAULT 0,
  permits JSONB DEFAULT '["access"]'::JSONB,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invitation_uses (
  id SERIAL PRIMARY KEY,
  token TEXT,
  relm TEXT,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- We model a single human being as a "user"
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- But a user can have many "players", i.e. a browser instance with a unique character
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  player_id UUID,
  public_key_doc JSONB UNIQUE,
  created_at TIMESTAMP WITH TIME ZOME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  relm TEXT,
  player_id UUID,
  permits JSONB
);

CREATE TABLE relms (
  relm TEXT PRIMARY KEY,
  transient_versions JSONB,
  permanent_versions JSONB,
  is_public BOOLEAN,
  encrypted_password TEXT,
  default_entryway INTEGER,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE relm_entryways (
  id SERIAL PRIMARY KEY,
  relm TEXT,
  entryway TEXT,
  position JSONB,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add initial setup token
INSERT INTO invitations (token, relm, permits)
VALUES ('setup', '*', '["admin","access","invite"]'::JSONB);
