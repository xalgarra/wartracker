-- =============================================================
-- PUNTOS POR UNIDAD
-- Fuente: AoS Battle Profiles April 2026 / WH40K MFM v4.2 April 2026
-- Precio = coste al tamaño mínimo de la unidad
-- =============================================================

ALTER TABLE units ADD COLUMN IF NOT EXISTS points int;

-- =============================================================
-- IDONETH DEEPKIN (AoS)
-- =============================================================
UPDATE units SET points = 340 WHERE name = 'Eidolon of Mathlann (Aspect of the Sea/Aspect of the Storm)' AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 210 WHERE name = 'Volturnos, High King of the Deep'     AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 140 WHERE name = 'Akhelian King'                         AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 90  WHERE name = 'Akhelian Thrallmaster'                 AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 100 WHERE name = 'Isharann Soulscryer'                   AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 90  WHERE name = 'Isharann Soulrender'                   AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 100 WHERE name = 'Isharann Tidecaster'                   AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 100 WHERE name = 'Lotann, Warden of the Soul Ledgers'    AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 150 WHERE name = 'Mathaela, Oracle of the Abyss'         AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 120 WHERE name = 'Ikon of the Sea/Ikon of the Storm'     AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 90  WHERE name = 'Namarti Thralls'                       AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 120 WHERE name = 'Namarti Reavers'                       AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 160 WHERE name = 'Akhelian Guard (Morrsarr/Ishlaen)'     AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 450 WHERE name = 'Akhelian Leviadon'                     AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 170 WHERE name = 'Akhelian Allopex'                      AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 0   WHERE name = 'Gloomtide Shipwreck'                   AND faction = 'Idoneth Deepkin';

-- =============================================================
-- DISCIPLES OF TZEENTCH (AoS)
-- =============================================================
UPDATE units SET points = 400 WHERE name = 'Kairos Fateweaver'                                      AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 380 WHERE name = 'Lord of Change'                                          AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 170 WHERE name = 'The Changeling'                                          AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 180 WHERE name = 'The Blue Scribes'                                        AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 180 WHERE name = 'Gaunt Summoner of Tzeentch'                             AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 210 WHERE name = 'Gaunt Summoner on Disc of Tzeentch'                     AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 130 WHERE name = 'Ogroid Thaumaturge'                                      AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 150 WHERE name = 'Fatemaster'                                              AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 140 WHERE name = 'Magister'                                                AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 150 WHERE name = 'Magister on Disc of Tzeentch'                           AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 130 WHERE name = 'Changecaster, Herald of Tzeentch'                       AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 180 WHERE name = 'Fluxmaster, Herald of Tzeentch on Disc'                 AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 140 WHERE name = 'Fateskimmer, Herald of Tzeentch on Burning Chariot'     AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 150 WHERE name = 'Curseling, Eye of Tzeentch'                             AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 130 WHERE name = 'Tzaangor Shaman'                                        AND faction = 'Disciples of Tzeentch' AND game_slug = 'aos';
UPDATE units SET points = 90  WHERE name = 'Kairic Acolytes'                                        AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 170 WHERE name = 'Pink Horrors of Tzeentch'                               AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 120 WHERE name = 'Blue Horrors/Brimstone Horrors of Tzeentch'             AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 130 WHERE name = 'Flamers of Tzeentch'                                    AND faction = 'Disciples of Tzeentch' AND game_slug = 'aos';
UPDATE units SET points = 110 WHERE name = 'Exalted Flamer of Tzeentch'                             AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 90  WHERE name = 'Screamers of Tzeentch'                                  AND faction = 'Disciples of Tzeentch' AND game_slug = 'aos';
UPDATE units SET points = 120 WHERE name = 'Burning Chariot of Tzeentch'                            AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 170 WHERE name = 'Tzaangors'                                              AND faction = 'Disciples of Tzeentch' AND game_slug = 'aos';
UPDATE units SET points = 200 WHERE name = 'Tzaangor Enlightened (a pie/en Disco de Tzeentch)'      AND faction = 'Disciples of Tzeentch' AND game_slug = 'aos';
UPDATE units SET points = 160 WHERE name = 'Tzaangor Skyfires'                                      AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 60  WHERE name = 'Chaos Spawn of Tzeentch'                                AND faction = 'Disciples of Tzeentch';
UPDATE units SET points = 100 WHERE name = 'Jade Obelisk'                                           AND faction = 'Disciples of Tzeentch';

-- =============================================================
-- THOUSAND SONS (40K)
-- =============================================================
UPDATE units SET points = 435 WHERE name = 'Magnus the Red'                                AND faction = 'Thousand Sons';
UPDATE units SET points = 100 WHERE name = 'Ahriman'                                      AND faction = 'Thousand Sons';
UPDATE units SET points = 100 WHERE name = 'Ahriman on Disc of Tzeentch'                  AND faction = 'Thousand Sons';
UPDATE units SET points = 80  WHERE name = 'Exalted Sorcerer'                             AND faction = 'Thousand Sons';
UPDATE units SET points = 100 WHERE name = 'Exalted Sorcerer on Disc of Tzeentch'         AND faction = 'Thousand Sons';
UPDATE units SET points = 95  WHERE name = 'Infernal Master'                              AND faction = 'Thousand Sons';
UPDATE units SET points = 80  WHERE name = 'Sorcerer'                                     AND faction = 'Thousand Sons';
UPDATE units SET points = 85  WHERE name = 'Sorcerer in Terminator Armour'                AND faction = 'Thousand Sons';
UPDATE units SET points = 180 WHERE name = 'Daemon Prince/Daemon Prince with Wings'       AND faction = 'Thousand Sons';
UPDATE units SET points = 100 WHERE name = 'Rubric Marines'                               AND faction = 'Thousand Sons';
UPDATE units SET points = 180 WHERE name = 'Scarab Occult Terminators'                    AND faction = 'Thousand Sons';
UPDATE units SET points = 80  WHERE name = 'Sekhetar Robots'                              AND faction = 'Thousand Sons';
UPDATE units SET points = 60  WHERE name = 'Tzaangor Shaman'                              AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 70  WHERE name = 'Tzaangors'                                    AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 45  WHERE name = 'Tzaangor Enlightened (a pie/en Disco de Tzeentch)' AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 170 WHERE name = 'Mutalith Vortex Beast'                        AND faction = 'Thousand Sons';
UPDATE units SET points = 110 WHERE name = 'Helbrute'                                     AND faction = 'Thousand Sons';
UPDATE units SET points = 130 WHERE name = 'Forgefiend/Maulerfiend'                       AND faction = 'Thousand Sons';
UPDATE units SET points = 250 WHERE name = 'Defiler'                                      AND faction = 'Thousand Sons';
UPDATE units SET points = 90  WHERE name = 'Chaos Rhino'                                  AND faction = 'Thousand Sons';
UPDATE units SET points = 130 WHERE name = 'Chaos Predator Destructor/Annihilator'        AND faction = 'Thousand Sons';
UPDATE units SET points = 215 WHERE name = 'Heldrake'                                     AND faction = 'Thousand Sons';
UPDATE units SET points = 220 WHERE name = 'Chaos Land Raider'                            AND faction = 'Thousand Sons';
UPDATE units SET points = 185 WHERE name = 'Chaos Vindicator'                             AND faction = 'Thousand Sons';
UPDATE units SET points = 65  WHERE name = 'Chaos Spawn'                                  AND faction = 'Thousand Sons';
-- Cross-game daemons (Scintillating Legions)
UPDATE units SET points = 115 WHERE name = 'Pink Horrors of Tzeentch'                     AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 90  WHERE name = 'Blue Horrors/Brimstone Horrors of Tzeentch'   AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 65  WHERE name = 'Flamers of Tzeentch'                          AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 65  WHERE name = 'Exalted Flamer of Tzeentch'                   AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 80  WHERE name = 'Screamers of Tzeentch'                        AND faction = 'Thousand Sons' AND game_slug = '40k';

-- =============================================================
-- ADEPTUS CUSTODES (40K)
-- =============================================================
UPDATE units SET points = 140 WHERE name = 'Trajann Valoris'                              AND faction = 'Adeptus Custodes';
UPDATE units SET points = 160 WHERE name = 'Custodian Guard'                              AND faction = 'Adeptus Custodes';
UPDATE units SET points = 210 WHERE name = 'Custodian Wardens'                            AND faction = 'Adeptus Custodes';
UPDATE units SET points = 110 WHERE name = 'Allarus Custodians'                           AND faction = 'Adeptus Custodes';
UPDATE units SET points = 120 WHERE name = 'Blade Champion'                               AND faction = 'Adeptus Custodes';
UPDATE units SET points = 150 WHERE name = 'Vertus Praetors'                              AND faction = 'Adeptus Custodes';
UPDATE units SET points = 120 WHERE name = 'Shield-Captain'                               AND faction = 'Adeptus Custodes';
UPDATE units SET points = 130 WHERE name = 'Shield-Captain in Allarus Terminator Armour'  AND faction = 'Adeptus Custodes';
UPDATE units SET points = 150 WHERE name = 'Shield-Captain on Dawneagle Jetbike'          AND faction = 'Adeptus Custodes';
UPDATE units SET points = 170 WHERE name = 'Venerable Contemptor Dreadnought'             AND faction = 'Adeptus Custodes';
UPDATE units SET points = 225 WHERE name = 'Telemon Heavy Dreadnought'                    AND faction = 'Adeptus Custodes';
UPDATE units SET points = 155 WHERE name = 'Galatus Dreadnought/Achillus Dreadnought'    AND faction = 'Adeptus Custodes';
UPDATE units SET points = 215 WHERE name = 'Caladius Grav-tank/Pallas Grav-attack'       AND faction = 'Adeptus Custodes';
UPDATE units SET points = 40  WHERE name = 'Sisters of Silence'                           AND faction = 'Adeptus Custodes';
UPDATE units SET points = 40  WHERE name = 'Prosecutors'                                  AND faction = 'Adeptus Custodes';
UPDATE units SET points = 45  WHERE name = 'Vigilators'                                   AND faction = 'Adeptus Custodes';
UPDATE units SET points = 45  WHERE name = 'Witchseekers'                                 AND faction = 'Adeptus Custodes';
UPDATE units SET points = 65  WHERE name = 'Aleya'                                        AND faction = 'Adeptus Custodes';
UPDATE units SET points = 110 WHERE name = 'Valerian'                                     AND faction = 'Adeptus Custodes';
UPDATE units SET points = 55  WHERE name = 'Knight-Centura'                               AND faction = 'Adeptus Custodes';
UPDATE units SET points = 220 WHERE name = 'Venerable Land Raider'                        AND faction = 'Adeptus Custodes';

-- =============================================================
-- ADEPTA SORORITAS (40K)
-- =============================================================
UPDATE units SET points = 150 WHERE name = 'Saint Celestine'                              AND faction = 'Adepta Sororitas';
UPDATE units SET points = 185 WHERE name = 'Morvenn Vahl, Abbess Sanctorum'               AND faction = 'Adepta Sororitas';
UPDATE units SET points = 80  WHERE name = 'Junith Eruita'                                AND faction = 'Adepta Sororitas';
UPDATE units SET points = 235 WHERE name = 'The Triumph of Saint Katherine'               AND faction = 'Adepta Sororitas';
UPDATE units SET points = 70  WHERE name = 'Aestred Thurga, Reliquant at Arms'            AND faction = 'Adepta Sororitas';
UPDATE units SET points = 60  WHERE name = 'Canoness'                                     AND faction = 'Adepta Sororitas';
UPDATE units SET points = 75  WHERE name = 'Canoness with Jump Pack'                      AND faction = 'Adepta Sororitas';
UPDATE units SET points = 50  WHERE name = 'Palatine'                                     AND faction = 'Adepta Sororitas';
UPDATE units SET points = 45  WHERE name = 'Dogmata'                                      AND faction = 'Adepta Sororitas';
UPDATE units SET points = 60  WHERE name = 'Hospitaller'                                  AND faction = 'Adepta Sororitas';
UPDATE units SET points = 65  WHERE name = 'Imagifier'                                    AND faction = 'Adepta Sororitas';
UPDATE units SET points = 40  WHERE name = 'Dialogus'                                     AND faction = 'Adepta Sororitas';
UPDATE units SET points = 50  WHERE name = 'Ministorum Priest'                            AND faction = 'Adepta Sororitas';
UPDATE units SET points = 150 WHERE name = 'Intranzia Fraye'                              AND faction = 'Adepta Sororitas';
UPDATE units SET points = 105 WHERE name = 'Battle Sisters Squad'                         AND faction = 'Adepta Sororitas';
UPDATE units SET points = 120 WHERE name = 'Dominion Squad'                               AND faction = 'Adepta Sororitas';
UPDATE units SET points = 70  WHERE name = 'Celestian Sacrosancts'                        AND faction = 'Adepta Sororitas';
UPDATE units SET points = 120 WHERE name = 'Celestian Insidiants'                         AND faction = 'Adepta Sororitas';
UPDATE units SET points = 80  WHERE name = 'Seraphim Squad'                               AND faction = 'Adepta Sororitas';
UPDATE units SET points = 80  WHERE name = 'Zephyrim Squad'                               AND faction = 'Adepta Sororitas';
UPDATE units SET points = 120 WHERE name = 'Retributor Squad'                             AND faction = 'Adepta Sororitas';
UPDATE units SET points = 75  WHERE name = 'Sisters Repentia'                             AND faction = 'Adepta Sororitas';
UPDATE units SET points = 45  WHERE name = 'Arco-flagellants'                             AND faction = 'Adepta Sororitas';
UPDATE units SET points = 75  WHERE name = 'Penitent Engine/Mortifier'                    AND faction = 'Adepta Sororitas';
UPDATE units SET points = 210 WHERE name = 'Paragon Warsuit'                              AND faction = 'Adepta Sororitas';
UPDATE units SET points = 115 WHERE name = 'Immolator/Rhino'                              AND faction = 'Adepta Sororitas';
UPDATE units SET points = 210 WHERE name = 'Exorcist'                                     AND faction = 'Adepta Sororitas';
UPDATE units SET points = 160 WHERE name = 'Castigator'                                   AND faction = 'Adepta Sororitas';
UPDATE units SET points = 100 WHERE name = 'Sisters Novitiate Squad'                      AND faction = 'Adepta Sororitas';
UPDATE units SET points = 110 WHERE name = 'Sanctifiers'                                  AND faction = 'Adepta Sororitas';
UPDATE units SET points = 85  WHERE name = 'Daemonifuge'                                  AND faction = 'Adepta Sororitas';
UPDATE units SET points = 50  WHERE name = 'Repentia Superior'                            AND faction = 'Adepta Sororitas';
