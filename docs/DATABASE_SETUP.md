# 🛠 Supabase Database Setup Guide

> ⚠️ **ATENÇÃO:** Este documento é mantido por referência histórica. Para novas migrações, use o arquivo **MIGRATION_INIT.sql** que contém toda a estrutura completa e atualizada.

## 📚 Arquivos Recomendados

Para uma **migração completa e moderna**, use:

1. **[MIGRATION_INIT.sql](MIGRATION_INIT.sql)** ⭐ **RECOMENDADO**
   - Script SQL completo
   - Todas as tabelas, índices e dados iniciais
   - Idempotente (seguro executar múltiplas vezes)
   - Versão 1.2 (2026-04-03)

2. **[CLASSES.md](CLASSES.md)**
   - Documentação detalhada de todas as tabelas
   - Estrutura de dados
   - Relacionamentos (ER Diagram)

3. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)**
   - Instruções passo a passo
   - Diferentes cenários de migração
   - Troubleshooting

---

## 📋 Como aplicar (Método Rápido)
1. Acesse o seu [Dashboard do Supabase](https://app.supabase.com/).
2. Vá em **SQL Editor** no menu lateral.
3. Clique em **New Query**.
4. Cole o conteúdo de **MIGRATION_INIT.sql** e clique em **Run**.

---

## 💾 SQL Script (Histórico v1.0)

```sql
-- ==========================================
-- 1. TABELAS
-- ==========================================

-- Tabela de Profissionais (Especialistas)
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  servico TEXT NOT NULL,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE NOT NULL,
  observacoes TEXT,
  status TEXT DEFAULT 'Confirmado' CHECK (status IN ('Pendente', 'Confirmado', 'Cancelado', 'Finalizado'))
);

-- ==========================================
-- 2. SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- ==========================================

-- Habilitar RLS
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA PROFISSIONAIS
CREATE POLICY "Profissionais são visíveis publicamente" 
ON profissionais FOR SELECT TO public USING (true);

CREATE POLICY "Gestores podem gerenciar profissionais" 
ON profissionais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POLÍTICAS PARA AGENDAMENTOS
CREATE POLICY "Agendamentos são visíveis publicamente" 
ON agendamentos FOR SELECT TO public USING (true);

CREATE POLICY "Clientes podem criar agendamentos" 
ON agendamentos FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Gestores podem editar agendamentos" 
ON agendamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestores podem deletar agendamentos" 
ON agendamentos FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 3. DADOS INICIAIS (SEED)
-- ==========================================

INSERT INTO profissionais (nome) VALUES ('Helena Costa'), ('Juliana Paiva'), ('Beatriz Lima');

-- ==========================================
-- 4. ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON agendamentos(profissional_id);
```

---

## 🔄 Versões do Schema

| Versão | Status | Data | Notas |
|--------|--------|------|-------|
| 1.0 | ✅ Histórico | 2026-04-03 | Profissionais + Agendamentos (DATABASE_SETUP.md) |
| 1.1 | ✅ Histórico | 2026-04-03 | Adição de tabela servicos (create_servicos_table.sql) |
| 1.2 | ✅ **ATUAL** | 2026-04-03 | Schema completo com todos os índices (MIGRATION_INIT.sql) |

---

## 🔒 Notas de Segurança Sênior

> [!IMPORTANT]
> As políticas acima permitem que o calendário seja público para que o sistema de slots funcione sem autenticação. Em produção, considere restringir o `SELECT` de `agendamentos` para retornar apenas `data_hora` via RPC, protegendo a privacidade dos nomes dos clientes.

> [!TIP]
> Garanta que seu arquivo `.env` contenha as chaves corretas:
> ```
> VITE_SUPABASE_URL=sua_url
> VITE_SUPABASE_ANON_KEY=sua_chave
> ```

---

## 📖 Referência de Documentação

- **Schema Atual:** Veja [CLASSES.md](CLASSES.md)
- **Instruções de Migração:** Veja [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Script Completo:** Veja [MIGRATION_INIT.sql](MIGRATION_INIT.sql)

