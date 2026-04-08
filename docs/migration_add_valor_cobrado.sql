-- Valor efetivamente cobrado no agendamento (pode ser o preço da tabela de serviços ou um valor negociado).
-- Execute no SQL Editor do Supabase (ou psql) uma vez por ambiente.

ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS valor_cobrado NUMERIC(10, 2);

COMMENT ON COLUMN agendamentos.valor_cobrado IS 'Preço cobrado neste agendamento (espelha servicos.preco ou valor personalizado).';

-- Opcional: preencher registros antigos com o preço atual do serviço (quando houver servico_id)
UPDATE agendamentos a
SET valor_cobrado = s.preco
FROM servicos s
WHERE a.servico_id = s.id
  AND a.valor_cobrado IS NULL;

CREATE INDEX IF NOT EXISTS idx_agendamentos_valor_cobrado ON agendamentos(valor_cobrado);
