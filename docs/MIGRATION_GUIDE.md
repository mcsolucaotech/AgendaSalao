# 🔄 Guia de Migração de Banco de Dados - Agenda.Ouro

> Instruções completas para migrar o banco de dados Supabase com a estrutura inicial do Agenda.Ouro.

## 📚 Arquivos de Referência

- **CLASSES.md** - Documentação completa de todas as tabelas e seus campos
- **MIGRATION_INIT.sql** - Script SQL para criar toda a estrutura (USE ESTE!)
- **DATABASE_SETUP.md** - Setup inicial (mantido para referência histórica)

---

## 🚀 Migração Rápida (5 minutos)

### Passo 1: Acessar Supabase
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral esquerdo

### Passo 2: Executar Script
1. Clique em **New Query**
2. Cole todo o conteúdo do arquivo `MIGRATION_INIT.sql`
3. Clique em **Run** (ou Ctrl+Enter)

### Passo 3: Validar
Verifique se as tabelas foram criadas:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

**Resultado esperado:**
- ✅ profissionais
- ✅ servicos
- ✅ agendamentos

---

## 🔍 Passo a Passo Detalhado

### 1️⃣ Preparação

**Antes de executar**, considere:

- ❓ Há dados antigos que precisam ser migrados?
- ⚠️ Existem agendamentos em andamento?
- 🔄 Precisa fazer backup?

**Se tem dados antigos:**
```sql
-- Fazer backup dos dados existentes
SELECT * FROM agendamentos ORDER BY data_hora DESC LIMIT 100;
```

### 2️⃣ Cenários de Migração

#### ✅ Novo Banco (Recomendado)
Execute simplesmente:
```sql
-- Cole todo o MIGRATION_INIT.sql
```

#### 🔄 Banco Existente (Com dados)
1. **Backup dos dados importantes:**
```sql
-- Exportar agendamentos
SELECT * FROM agendamentos WHERE status NOT IN ('Cancelado', 'Finalizado');
```

2. **Limpar estrutura antiga (CUIDADO!):**
```sql
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS profissionais CASCADE;
```

3. **Executar migração:**
```sql
-- Cole todo o MIGRATION_INIT.sql
```

4. **Restaurar dados (se houver):**
```sql
-- Reimportar agendamentos
INSERT INTO agendamentos (...) VALUES (...);
```

#### 🆙 Incremento (Adicionar apenas o novo)
Se profissionais e agendamentos já existem, execute APENAS:
```sql
-- Criar tabela servicos (se não existir)
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Serviços são visíveis publicamente" ON servicos FOR SELECT TO public USING (true);
CREATE POLICY "Gestores podem gerenciar serviços" ON servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Adicionar servico_id em agendamentos (se não existir)
ALTER TABLE agendamentos ADD COLUMN servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL;

-- Inserir serviços
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
```

---

## ✅ Checklist Pré-Migração

- [ ] Fazer backup dos dados importantes
- [ ] Comunicar equipe sobre downtime (se houver)
- [ ] Testar em ambiente de staging primeiro
- [ ] Verificar integridade dos dados após migração
- [ ] Atualizar configurações de ambiente se necessário

---

## 🐛 Troubleshooting

### ❌ Erro: "relation already exists"
**Causa:** Tabela já existe
```sql
-- Solução: Execute com DROP primeiro
DROP TABLE IF EXISTS profissionais CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
-- Depois execute MIGRATION_INIT.sql
```

### ❌ Erro: "foreign key violation"
**Causa:** Ordem de criação de tabelas ou dados inválidos
**Solução:** Certifique que:
1. `profissionais` é criada ANTES de `agendamentos`
2. `servicos` é criada ANTES de usar em `agendamentos`
3. Execute o script inteiro de uma vez (dentro de BEGIN/COMMIT)

### ❌ Erro: "permission denied"
**Causa:** Usuário sem privilégios suficientes
**Solução:** Use uma conta com permissões de administrador do Supabase

### ✅ Erro: "policy already exists"
**Causa:** Políticas duplicadas (não é crítico)
**Solução:** Seguro de ignorar, o script usa `CREATE POLICY IF NOT EXISTS` implicitamente

---

## 📊 Validação Pós-Migração

### 1. Verificar Tabelas
```sql
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Resultado esperado:**
```
table_name    | table_schema
--------------|-------------
profissionais | public
servicos      | public
agendamentos  | public
```

### 2. Verificar Dados
```sql
-- Profissionais
SELECT COUNT(*) as total_profissionais FROM profissionais;
-- Resultado: 3

-- Serviços
SELECT COUNT(*) as total_servicos FROM servicos;
-- Resultado: 9

-- Agendamentos (vazio no início)
SELECT COUNT(*) as total_agendamentos FROM agendamentos;
-- Resultado: 0
```

### 3. Verificar Índices
```sql
SELECT tablename, indexname FROM pg_indexes WHERE tablename IN ('profissionais', 'servicos', 'agendamentos');
```

### 4. Verificar RLS
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profissionais', 'servicos', 'agendamentos');
```

**Todos devem ser `true`**

---

## 🔄 Versioning

| Versão | Data | Alterações |
|--------|------|-----------|
| 1.0 | 2026-04-03 | Criação inicial (profissionais + agendamentos) |
| 1.1 | 2026-04-03 | Adição de tabela servicos |
| 1.2 | 2026-04-03 | Adição de servico_id em agendamentos + índices |

---

## 📝 Notas Importantes

### 🔐 Segurança
- ✅ RLS está habilitado em produção
- ✅ Dados de clientes estão protegidos
- ⚠️ DELETE CASCADE em profissionais para agendamentos (cascata de deleção)

### ⚡ Performance
- ✅ 9 índices criados para queries rápidas
- ✅ Índices em campos frequentemente filtrados
- ✅ Índices em foreign keys

### 🆘 Suporte com Terceiros
Se precisa migrar entre provedores:
1. Exporte dados via interface Supabase
2. Use ferramenta como `supabase db dump`
3. Adapte o script SQL conforme necessário
4. Execute nesse guia

---

## 📊 Estrutura Visual (ER)

```
┌──────────────────┐
│  PROFISSIONAIS   │
│  (3 registros)   │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────┐
│   AGENDAMENTOS       │
│  (vazio, pronto)     │
└────────┬─────────────┘
         │
         │ N:1
         ▼
    ┌─────────────┐
    │  SERVIÇOS   │
    │(9 registros)│
    └─────────────┘
```

---

## 🚀 Próximas Etapas

1. ✅ Executar migração
2. ✅ Validar dados no Supabase
3. ✅ Testar com a aplicação frontend
4. ✅ Monitorar logs de erro
5. ✅ Comunicar ao time que está pronto

**Contato:** Dev Team (Senior Backend)  
**Última atualização:** 3 de abril de 2026
