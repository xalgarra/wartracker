-- =============================================================
-- UNIT TYPES — añade columna type a units y la puebla
-- Tipos: único, personaje, infantería, élite, caballería,
--        vehículo, monstruo, aeronave, artillería
-- =============================================================

ALTER TABLE units ADD COLUMN IF NOT EXISTS type text;


-- =============================================================
-- IDONETH DEEPKIN (AoS)
-- =============================================================
UPDATE units SET type = 'único'     WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Eidolon of Mathlann (Aspect of the Sea/Aspect of the Storm)',
  'Volturnos, High King of the Deep',
  'Lotann, Warden of the Soul Ledgers',
  'Mathaela, Oracle of the Abyss'
);
UPDATE units SET type = 'personaje' WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Akhelian King', 'Akhelian Thrallmaster',
  'Isharann Soulscryer', 'Isharann Soulrender', 'Isharann Tidecaster'
);
UPDATE units SET type = 'infantería' WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Namarti Thralls', 'Namarti Reavers'
);
UPDATE units SET type = 'élite'    WHERE faction = 'Idoneth Deepkin' AND name = 'Akhelian Guard (Morrsarr/Ishlaen)';
UPDATE units SET type = 'monstruo' WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Akhelian Leviadon', 'Akhelian Allopex'
);
-- Gloomtide Shipwreck y Ikon of the Sea/Storm son terreno — se dejan sin tipo


-- =============================================================
-- DISCIPLES OF TZEENTCH (AoS)
-- =============================================================
UPDATE units SET type = 'único'     WHERE faction = 'Disciples of Tzeentch' AND name IN (
  'Kairos Fateweaver', 'The Changeling', 'The Blue Scribes',
  'Curseling, Eye of Tzeentch'
);
UPDATE units SET type = 'monstruo'  WHERE faction = 'Disciples of Tzeentch' AND name = 'Lord of Change';
UPDATE units SET type = 'personaje' WHERE faction = 'Disciples of Tzeentch' AND name IN (
  'Gaunt Summoner of Tzeentch', 'Gaunt Summoner on Disc of Tzeentch',
  'Ogroid Thaumaturge', 'Fatemaster',
  'Magister', 'Magister on Disc of Tzeentch',
  'Changecaster, Herald of Tzeentch',
  'Fluxmaster, Herald of Tzeentch on Disc',
  'Fateskimmer, Herald of Tzeentch on Burning Chariot',
  'Tzaangor Shaman',
  'Exalted Flamer of Tzeentch'
);
UPDATE units SET type = 'infantería' WHERE faction = 'Disciples of Tzeentch' AND name IN (
  'Kairic Acolytes', 'Pink Horrors of Tzeentch',
  'Blue Horrors/Brimstone Horrors of Tzeentch', 'Tzaangors'
);
UPDATE units SET type = 'élite'     WHERE faction = 'Disciples of Tzeentch' AND name IN (
  'Flamers of Tzeentch', 'Screamers of Tzeentch',
  'Tzaangor Enlightened (a pie/en Disco de Tzeentch)', 'Tzaangor Skyfires'
);
UPDATE units SET type = 'vehículo'  WHERE faction = 'Disciples of Tzeentch' AND name = 'Burning Chariot of Tzeentch';
UPDATE units SET type = 'monstruo'  WHERE faction = 'Disciples of Tzeentch' AND name = 'Chaos Spawn of Tzeentch';
-- Jade Obelisk es terreno — se deja sin tipo


-- =============================================================
-- THOUSAND SONS (40K)
-- =============================================================
UPDATE units SET type = 'único'     WHERE faction = 'Thousand Sons' AND name IN (
  'Magnus the Red', 'Ahriman', 'Kairos Fateweaver'
);
UPDATE units SET type = 'personaje' WHERE faction = 'Thousand Sons' AND name IN (
  'Exalted Sorcerer', 'Exalted Sorcerer on Disc of Tzeentch',
  'Sorcerer', 'Sorcerer in Terminator Armour',
  'Infernal Master', 'Tzaangor Shaman',
  'Daemon Prince of Tzeentch', 'Daemon Prince of Tzeentch with Wings',
  'Exalted Flamer of Tzeentch'
);
UPDATE units SET type = 'infantería' WHERE faction = 'Thousand Sons' AND name IN (
  'Rubric Marines', 'Tzaangors',
  'Pink Horrors of Tzeentch', 'Blue Horrors/Brimstone Horrors of Tzeentch'
);
UPDATE units SET type = 'élite'     WHERE faction = 'Thousand Sons' AND name IN (
  'Scarab Occult Terminators', 'Sekhetar Robots',
  'Flamers of Tzeentch', 'Screamers of Tzeentch',
  'Tzaangor Enlightened', 'Tzaangor Enlightened with Fatecaster Greatbows'
);
UPDATE units SET type = 'monstruo'  WHERE faction = 'Thousand Sons' AND name IN (
  'Mutalith Vortex Beast', 'Chaos Spawn', 'Lord of Change'
);
UPDATE units SET type = 'vehículo'  WHERE faction = 'Thousand Sons' AND name IN (
  'Helbrute', 'Defiler', 'Chaos Rhino',
  'Forgefiend', 'Maulerfiend',
  'Chaos Predator Annihilator', 'Chaos Predator Destructor',
  'Chaos Land Raider', 'Chaos Vindicator'
);
UPDATE units SET type = 'aeronave'  WHERE faction = 'Thousand Sons' AND name = 'Heldrake';


-- =============================================================
-- ADEPTUS CUSTODES (40K)
-- =============================================================
UPDATE units SET type = 'único'     WHERE faction = 'Adeptus Custodes' AND name IN (
  'Trajann Valoris', 'Aleya', 'Valerian'
);
UPDATE units SET type = 'personaje' WHERE faction = 'Adeptus Custodes' AND name IN (
  'Blade Champion', 'Knight-Centura',
  'Shield-Captain',
  'Shield-Captain in Allarus Terminator Armour',
  'Shield-Captain on Dawneagle Jetbike'
);
UPDATE units SET type = 'élite'     WHERE faction = 'Adeptus Custodes' AND name IN (
  'Custodian Guard', 'Custodian Wardens', 'Allarus Custodians',
  'Sisters of Silence', 'Prosecutors', 'Vigilators', 'Witchseekers'
);
UPDATE units SET type = 'caballería' WHERE faction = 'Adeptus Custodes' AND name = 'Vertus Praetors';
UPDATE units SET type = 'vehículo'  WHERE faction = 'Adeptus Custodes' AND name IN (
  'Venerable Contemptor Dreadnought', 'Telemon Heavy Dreadnought',
  'Galatus Dreadnought/Achillus Dreadnought',
  'Caladius Grav-tank/Pallas Grav-attack',
  'Venerable Land Raider'
);


-- =============================================================
-- ADEPTA SORORITAS (40K)
-- =============================================================
UPDATE units SET type = 'único'     WHERE faction = 'Adepta Sororitas' AND name IN (
  'Saint Celestine', 'Morvenn Vahl, Abbess Sanctorum',
  'Junith Eruita', 'The Triumph of Saint Katherine',
  'Aestred Thurga, Reliquant at Arms',
  'Intranzia Fraye', 'Daemonifuge'
);
UPDATE units SET type = 'personaje' WHERE faction = 'Adepta Sororitas' AND name IN (
  'Canoness', 'Canoness with Jump Pack', 'Palatine',
  'Dogmata', 'Hospitaller', 'Imagifier', 'Dialogus',
  'Repentia Superior', 'Ministorum Priest'
);
UPDATE units SET type = 'infantería' WHERE faction = 'Adepta Sororitas' AND name IN (
  'Battle Sisters Squad', 'Sisters Novitiate Squad'
);
UPDATE units SET type = 'élite'     WHERE faction = 'Adepta Sororitas' AND name IN (
  'Dominion Squad', 'Celestian Sacrosancts', 'Celestian Insidiants',
  'Seraphim Squad', 'Zephyrim Squad',
  'Retributor Squad', 'Sisters Repentia',
  'Arco-flagellants', 'Sanctifiers'
);
UPDATE units SET type = 'monstruo'  WHERE faction = 'Adepta Sororitas' AND name = 'Penitent Engine/Mortifier';
UPDATE units SET type = 'vehículo'  WHERE faction = 'Adepta Sororitas' AND name IN (
  'Paragon Warsuit', 'Immolator/Rhino', 'Exorcist', 'Castigator'
);
