-- ==========================================
-- TABELA DE SERVIÇOS
-- ==========================================

CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Políticas para serviços
CREATE POLICY "Serviços são visíveis publicamente"
ON servicos FOR SELECT TO public USING (true);

CREATE POLICY "Gestores podem gerenciar serviços"
ON servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- ATUALIZAR TABELA AGENDAMENTOS
-- ==========================================

-- Adicionar coluna servico_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'servico_id') THEN
    ALTER TABLE agendamentos ADD COLUMN servico_id UUID REFERENCES servicos(id);
  END IF;
END $$;

-- ==========================================
-- DADOS INICIAIS (SERVIÇOS)
-- ==========================================

INSERT INTO servicos (descricao, categoria, preco) VALUES
('Corte Masculino', 'Corte', 50.00),
('Corte Feminino', 'Corte', 80.00),
('Escova', 'Finalização', 60.00),
('Progressiva', 'Tratamento', 250.00),
('Manicure', 'Unhas', 40.00),
('Pedicure', 'Unhas', 45.00),
('Coloração', 'Cor', 150.00),
('Luzes', 'Cor', 350.00),
('Hidratação', 'Tratamento', 120.00);

-- ==========================================
-- ÍNDICE DE PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
CREATE INDEX IF NOT EXISTS idx_agendamentos_servico_id ON agendamentos(servico_id);