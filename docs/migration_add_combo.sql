-- Adiciona coluna combo_id para agrupar agendamentos de um mesmo combo
ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS combo_id UUID DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_agendamentos_combo_id ON agendamentos(combo_id);
