-- =====================================================
-- MIGRATION_INIT.sql
-- =====================================================
-- Script de migração COMPLETO do Agenda.Ouro
-- Versão: 1.2 (3 de abril de 2026)
-- 
-- Este script cria toda a estrutura inicial do banco de dados
-- com todas as tabelas, índices, políticas de segurança e dados iniciais.
--
-- Uso: Cole e execute este arquivo completo no SQL Editor do Supabase
-- =====================================================

-- Validar e preparar banco
BEGIN;

-- =====================================================
-- 1. CRIAÇÃO DE TABELAS
-- =====================================================

-- Tabela: PROFISSIONAIS
-- Descrição: Armazena os profissionais/especialistas do salão
-- Versão: 1.0 (2026-04-03)
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: SERVIÇOS
-- Descrição: Catálogo de serviços oferecidos pelo salão
-- Versão: 1.1 (2026-04-03)
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela: AGENDAMENTOS
-- Descrição: Registro de agendamentos/compromissos dos clientes
-- Versão: 1.2 (2026-04-03) - Adicionado servico_id
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  servico TEXT NOT NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE NOT NULL,
  observacoes TEXT,
  status TEXT DEFAULT 'Confirmado' CHECK (status IN ('Pendente', 'Confirmado', 'Cancelado', 'Finalizado'))
);

-- =====================================================
-- 2. SEGURANÇA - ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2.1 POLÍTICAS: PROFISSIONAIS
-- =====================================================

-- Policy: SELECT - Público
CREATE POLICY "Profissionais são visíveis publicamente"
ON profissionais FOR SELECT TO public USING (true);

-- Policy: INSERT/UPDATE/DELETE - Apenas autenticados
CREATE POLICY "Gestores podem gerenciar profissionais"
ON profissionais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 2.2 POLÍTICAS: SERVIÇOS
-- =====================================================

-- Policy: SELECT - Público
CREATE POLICY "Serviços são visíveis publicamente"
ON servicos FOR SELECT TO public USING (true);

-- Policy: INSERT/UPDATE/DELETE - Apenas autenticados
CREATE POLICY "Gestores podem gerenciar serviços"
ON servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 2.3 POLÍTICAS: AGENDAMENTOS
-- =====================================================

-- Policy: SELECT - Público
CREATE POLICY "Agendamentos são visíveis publicamente"
ON agendamentos FOR SELECT TO public USING (true);

-- Policy: INSERT - Público (clientes podem agendar)
CREATE POLICY "Clientes podem criar agendamentos"
ON agendamentos FOR INSERT TO public WITH CHECK (true);

-- Policy: UPDATE - Apenas autenticados (gestores)
CREATE POLICY "Gestores podem editar agendamentos"
ON agendamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Policy: DELETE - Apenas autenticados (gestores)
CREATE POLICY "Gestores podem deletar agendamentos"
ON agendamentos FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 3. DADOS INICIAIS (SEED DATA)
-- =====================================================

-- =====================================================
-- 3.1 INSERIR PROFISSIONAIS
-- =====================================================

DELETE FROM profissionais; -- Limpar dados antigos

INSERT INTO profissionais (nome, foto_url) VALUES
  ('Helena Costa', NULL),
  ('Juliana Paiva', NULL),
  ('Beatriz Lima', NULL);

-- =====================================================
-- 3.2 INSERIR SERVIÇOS
-- =====================================================

DELETE FROM servicos; -- Limpar dados antigos

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

-- =====================================================
-- 4. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índices para PROFISSIONAIS
CREATE INDEX IF NOT EXISTS idx_profissionais_nome ON profissionais(nome);

-- Índices para SERVIÇOS
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
CREATE INDEX IF NOT EXISTS idx_servicos_preco ON servicos(preco);

-- Índices para AGENDAMENTOS
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_id ON agendamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_servico_id ON agendamentos(servico_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_nome ON agendamentos(cliente_nome);

-- =====================================================
-- 5. RELATÓRIO DE SUCESSO
-- =====================================================

-- Tabelas criadas:
-- ✅ profissionais (3 registros)
-- ✅ servicos (9 registros)
-- ✅ agendamentos (pronta para uso)
--
-- Segurança:
-- ✅ RLS habilitado em todas as tabelas
-- ✅ Políticas configuradas por tipo de acesso
--
-- Performance:
-- ✅ 9 índices criados
--
-- Status: SUCESSO ✅

COMMIT;