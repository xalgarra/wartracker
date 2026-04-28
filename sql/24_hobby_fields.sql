-- Campos de planificación de hobby en minis (v1: blocker + assembly risk)
ALTER TABLE minis ADD COLUMN IF NOT EXISTS hobby_blocker text;
ALTER TABLE minis ADD COLUMN IF NOT EXISTS assembly_risk text;

-- hobby_blocker: null | 'assembly' | 'priming' | 'hard_to_reach' | 'motivation' | 'decision'
-- assembly_risk: null | 'low' | 'medium' | 'high'
