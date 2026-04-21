CREATE TABLE games (
  id serial primary key,
  name text not null,
  slug text not null unique
);

CREATE TABLE factions (
  id serial primary key,
  name text not null,
  game_slug text not null references games(slug)
);

CREATE TABLE minis (
  id int8 primary key,
  created_at timestamptz default now(),
  name text not null,
  faction text,
  game text,
  qty int4 default 1,
  status text,
  notes text
);