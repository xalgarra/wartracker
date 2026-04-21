-- =============================================================
-- TABLA UNITS: catálogo estático de unidades por facción
-- =============================================================
-- El campo "name" usa "/" para indicar que un mismo kit físico
-- puede montarse como dos unidades distintas.
-- Ej: "Forgefiend/Maulerfiend" = una caja, dos opciones.
-- =============================================================

CREATE TABLE IF NOT EXISTS units (
  id        serial PRIMARY KEY,
  name      text NOT NULL,
  faction   text NOT NULL,
  game_slug text NOT NULL REFERENCES games(slug)
);

-- RLS: solo usuarios autenticados pueden leer
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read units"
  ON units FOR SELECT
  TO authenticated
  USING (true);


-- =============================================================
-- AGE OF SIGMAR — Idoneth Deepkin
-- =============================================================
INSERT INTO units (name, faction, game_slug) VALUES
  ('Eidolon of Mathlann (Aspect of the Sea/Aspect of the Storm)', 'Idoneth Deepkin', 'aos'),
  ('Volturnos, High King of the Deep',                            'Idoneth Deepkin', 'aos'),
  ('Akhelian King',                                               'Idoneth Deepkin', 'aos'),
  ('Isharann Soulscryer',                                         'Idoneth Deepkin', 'aos'),
  ('Isharann Soulrender',                                         'Idoneth Deepkin', 'aos'),
  ('Isharann Tidecaster',                                         'Idoneth Deepkin', 'aos'),
  ('Lotann, Warden of the Soul Ledgers',                          'Idoneth Deepkin', 'aos'),
  ('Namarti Thrallmaster',                                        'Idoneth Deepkin', 'aos'),
  ('Namarti Thralls',                                             'Idoneth Deepkin', 'aos'),
  ('Namarti Reavers',                                             'Idoneth Deepkin', 'aos'),
  ('Akhelian Guard (Morrsarr/Ishlaen)',                           'Idoneth Deepkin', 'aos'),
  ('Akhelian Leviadon',                                           'Idoneth Deepkin', 'aos'),
  ('Akhelian Allopex',                                            'Idoneth Deepkin', 'aos'),
  ('Gloomtide Shipwreck',                                         'Idoneth Deepkin', 'aos');


-- =============================================================
-- AGE OF SIGMAR — Disciples of Tzeentch
-- =============================================================
INSERT INTO units (name, faction, game_slug) VALUES
  ('Kairos Fateweaver',                                              'Disciples of Tzeentch', 'aos'),
  ('Lord of Change',                                                 'Disciples of Tzeentch', 'aos'),
  ('The Changeling',                                                 'Disciples of Tzeentch', 'aos'),
  ('The Blue Scribes',                                               'Disciples of Tzeentch', 'aos'),
  ('Gaunt Summoner of Tzeentch',                                     'Disciples of Tzeentch', 'aos'),
  ('Ogroid Thaumaturge',                                             'Disciples of Tzeentch', 'aos'),
  ('Fatemaster',                                                     'Disciples of Tzeentch', 'aos'),
  ('Magister',                                                       'Disciples of Tzeentch', 'aos'),
  ('Changecaster, Herald of Tzeentch',                               'Disciples of Tzeentch', 'aos'),
  ('Fluxmaster, Herald of Tzeentch on Disc',                         'Disciples of Tzeentch', 'aos'),
  ('Fateskimmer, Herald of Tzeentch on Burning Chariot',             'Disciples of Tzeentch', 'aos'),
  ('Tzaangor Shaman',                                                'Disciples of Tzeentch', 'aos'),
  ('Kairic Acolytes',                                                'Disciples of Tzeentch', 'aos'),
  ('Pink Horrors of Tzeentch',                                       'Disciples of Tzeentch', 'aos'),
  ('Blue Horrors of Tzeentch',                                       'Disciples of Tzeentch', 'aos'),
  ('Brimstone Horrors of Tzeentch',                                  'Disciples of Tzeentch', 'aos'),
  ('Flamers of Tzeentch',                                            'Disciples of Tzeentch', 'aos'),
  ('Exalted Flamer of Tzeentch',                                     'Disciples of Tzeentch', 'aos'),
  ('Screamers of Tzeentch',                                          'Disciples of Tzeentch', 'aos'),
  ('Burning Chariot of Tzeentch',                                    'Disciples of Tzeentch', 'aos'),
  ('Tzaangors',                                                      'Disciples of Tzeentch', 'aos'),
  ('Tzaangor Enlightened (a pie/en Disco de Tzeentch)',              'Disciples of Tzeentch', 'aos'),
  ('Tzaangor Skyfires',                                              'Disciples of Tzeentch', 'aos');


-- =============================================================
-- WARHAMMER 40K — Thousand Sons
-- =============================================================
INSERT INTO units (name, faction, game_slug) VALUES
  ('Magnus the Red',                       'Thousand Sons', '40k'),
  ('Ahriman',                              'Thousand Sons', '40k'),
  ('Ahriman on Disc of Tzeentch',          'Thousand Sons', '40k'),
  ('Exalted Sorcerer',                     'Thousand Sons', '40k'),
  ('Infernal Master',                      'Thousand Sons', '40k'),
  ('Daemon Prince/Daemon Prince with Wings','Thousand Sons', '40k'),
  ('Rubric Marines',                       'Thousand Sons', '40k'),
  ('Scarab Occult Terminators',            'Thousand Sons', '40k'),
  ('Tzaangor Shaman',                      'Thousand Sons', '40k'),
  ('Tzaangors',                            'Thousand Sons', '40k'),
  ('Mutalith Vortex Beast',                'Thousand Sons', '40k'),
  ('Helbrute',                             'Thousand Sons', '40k'),
  ('Forgefiend/Maulerfiend',               'Thousand Sons', '40k'),
  ('Defiler',                              'Thousand Sons', '40k'),
  ('Chaos Rhino',                          'Thousand Sons', '40k'),
  ('Chaos Predator Destructor/Annihilator','Thousand Sons', '40k');


-- =============================================================
-- WARHAMMER 40K — Adeptus Custodes
-- =============================================================
INSERT INTO units (name, faction, game_slug) VALUES
  ('Trajann Valoris',                                    'Adeptus Custodes', '40k'),
  ('Custodian Guard',                                    'Adeptus Custodes', '40k'),
  ('Custodian Wardens',                                  'Adeptus Custodes', '40k'),
  ('Allarus Custodians',                                 'Adeptus Custodes', '40k'),
  ('Blade Champion',                                     'Adeptus Custodes', '40k'),
  ('Vertus Praetors',                                    'Adeptus Custodes', '40k'),
  ('Shield-Captain',                                     'Adeptus Custodes', '40k'),
  ('Shield-Captain in Allarus Terminator Armour',        'Adeptus Custodes', '40k'),
  ('Shield-Captain on Dawneagle Jetbike',                'Adeptus Custodes', '40k'),
  ('Venerable Contemptor Dreadnought',                   'Adeptus Custodes', '40k'),
  ('Telemon Heavy Dreadnought',                          'Adeptus Custodes', '40k'),
  ('Galatus Dreadnought/Achillus Dreadnought',           'Adeptus Custodes', '40k'),
  ('Caladius Grav-tank/Pallas Grav-attack',              'Adeptus Custodes', '40k'),
  ('Sisters of Silence',                                 'Adeptus Custodes', '40k'),
  ('Prosecutors',                                        'Adeptus Custodes', '40k'),
  ('Vigilators',                                         'Adeptus Custodes', '40k'),
  ('Witchseekers',                                       'Adeptus Custodes', '40k');


-- =============================================================
-- WARHAMMER 40K — Adepta Sororitas
-- =============================================================
INSERT INTO units (name, faction, game_slug) VALUES
  ('Saint Celestine',                          'Adepta Sororitas', '40k'),
  ('Morvenn Vahl, Abbess Sanctorum',           'Adepta Sororitas', '40k'),
  ('Junith Eruita',                            'Adepta Sororitas', '40k'),
  ('The Triumph of Saint Katherine',           'Adepta Sororitas', '40k'),
  ('Aestred Thurga, Reliquant at Arms',        'Adepta Sororitas', '40k'),
  ('Canoness',                                 'Adepta Sororitas', '40k'),
  ('Palatine',                                 'Adepta Sororitas', '40k'),
  ('Dogmata',                                  'Adepta Sororitas', '40k'),
  ('Hospitaller',                              'Adepta Sororitas', '40k'),
  ('Imagifier',                                'Adepta Sororitas', '40k'),
  ('Dialogus',                                 'Adepta Sororitas', '40k'),
  ('Battle Sisters Squad',                     'Adepta Sororitas', '40k'),
  ('Dominion Squad',                           'Adepta Sororitas', '40k'),
  ('Celestian Squad',                          'Adepta Sororitas', '40k'),
  ('Celestian Sacrosancts',                    'Adepta Sororitas', '40k'),
  ('Seraphim Squad/Zephyrim Squad',            'Adepta Sororitas', '40k'),
  ('Retributor Squad',                         'Adepta Sororitas', '40k'),
  ('Sisters Repentia',                         'Adepta Sororitas', '40k'),
  ('Repentia Superior',                        'Adepta Sororitas', '40k'),
  ('Arco-flagellants',                         'Adepta Sororitas', '40k'),
  ('Penitent Engine/Mortifier',                'Adepta Sororitas', '40k'),
  ('Paragon Warsuit',                          'Adepta Sororitas', '40k'),
  ('Immolator/Rhino',                          'Adepta Sororitas', '40k'),
  ('Exorcist',                                 'Adepta Sororitas', '40k'),
  ('Castigator',                               'Adepta Sororitas', '40k');
