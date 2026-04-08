# 📊 Estrutura de Classes - Agenda.Ouro

> Documento centralizado de todas as tabelas/classes do sistema para facilitar migrações de banco de dados e manutenção.

## 📋 Índice de Tabelas

1. [Profissionais](#profissionais)
2. [Serviços](#serviços)
3. [Agendamentos](#agendamentos)

---

## Profissionais

**Descrição:** Armazena os profissionais/especialistas do salão.

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|------------|
| `id` | UUID | Identificador único | PK, DEFAULT gen_random_uuid() |
| `nome` | TEXT | Nome completo do profissional | NOT NULL |
| `foto_url` | TEXT | URL da foto de perfil | Opcional |
| `created_at` | TIMESTAMP | Data de criação | NOT NULL, DEFAULT now() |

**Índices:**
- PRIMARY KEY: `id`

**Dados Iniciais:**
- Helena Costa
- Juliana Paiva
- Beatriz Lima

**RLS (Row Level Security):**
- ✅ SELECT: Público (todos podem visualizar)
- ✅ INSERT/UPDATE/DELETE: Apenas autenticados

---

## Serviços

**Descrição:** Catálogo de serviços oferecidos pelo salão.

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|------------|
| `id` | UUID | Identificador único | PK, DEFAULT gen_random_uuid() |
| `descricao` | TEXT | Nome/descrição do serviço | NOT NULL |
| `categoria` | TEXT | Categoria do serviço | NOT NULL |
| `preco` | DECIMAL(10,2) | Valor do serviço | NOT NULL |
| `created_at` | TIMESTAMP | Data de criação | NOT NULL, DEFAULT now() |

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `categoria` (busca por categoria)

**Dados Iniciais:**
- Corte Masculino | Corte | R$ 50.00
- Corte Feminino | Corte | R$ 80.00
- Escova | Finalização | R$ 60.00
- Progressiva | Tratamento | R$ 250.00
- Manicure | Unhas | R$ 40.00
- Pedicure | Unhas | R$ 45.00
- Coloração | Cor | R$ 150.00
- Luzes | Cor | R$ 350.00
- Hidratação | Tratamento | R$ 120.00

**RLS (Row Level Security):**
- ✅ SELECT: Público (todos podem visualizar)
- ✅ INSERT/UPDATE/DELETE: Apenas autenticados

---

## Agendamentos

**Descrição:** Registro de agendamentos/compromissos dos clientes.

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|------------|
| `id` | UUID | Identificador único | PK, DEFAULT gen_random_uuid() |
| `created_at` | TIMESTAMP | Data de criação do agendamento | NOT NULL, DEFAULT now() |
| `data_hora` | TIMESTAMP | Data e hora do agendamento | NOT NULL |
| `cliente_nome` | TEXT | Nome do cliente | NOT NULL |
| `cliente_telefone` | TEXT | Telefone do cliente | Opcional |
| `servico` | TEXT | Descrição do serviço | NOT NULL |
| `servico_id` | UUID | Reference ao serviço realizado | FK → servicos(id) |
| `profissional_id` | UUID | Reference ao profissional | FK → profissionais(id), ON DELETE CASCADE, NOT NULL |
| `observacoes` | TEXT | Observações adicionais | Opcional |
| `status` | TEXT | Status do agendamento | DEFAULT 'Confirmado', CHECK IN ('Pendente', 'Confirmado', 'Cancelado', 'Finalizado') |

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `data_hora` (busca temporal)
- INDEX: `profissional_id` (busca por profissional)
- INDEX: `servico_id` (busca por serviço)

**RLS (Row Level Security):**
- ✅ SELECT: Público (timeline apenas com data/hora)
- ✅ INSERT: Público (clientes podem agendar)
- ✅ UPDATE/DELETE: Apenas autenticados (gestores)

---

## 🔄 Relacionamentos (ER Diagram)

```
┌─────────────────┐
│  profissionais  │
├─────────────────┤
│ id (PK)         │
│ nome            │
│ foto_url        │
│ created_at      │
└────────┬────────┘
         │
         │ (1:N)
         │
         ▼
┌─────────────────────┐
│   agendamentos      │
├─────────────────────┤
│ id (PK)             │
│ created_at          │
│ data_hora           │
│ cliente_nome        │
│ cliente_telefone    │
│ servico             │
│ servico_id (FK) ──┐ │
│ profissional_id(FK)│ │
│ observacoes         │ │
│ status              │ │
└─────────────────────┘ │
                        │
                        │ (N:1)
                        │
                        ▼
                  ┌──────────────┐
                  │   servicos   │
                  ├──────────────┤
                  │ id (PK)      │
                  │ descricao    │
                  │ categoria    │
                  │ preco        │
                  │ created_at   │
                  └──────────────┘
```

---

## 📝 Histórico de Alterações

| Data | Alteração | Versão |
|------|-----------|--------|
| 2026-04-03 | Criação inicial de profissionais e agendamentos | 1.0 |
| 2026-04-03 | Adição da tabela servicos | 1.1 |
| 2026-04-03 | Adição de servico_id em agendamentos | 1.2 |

---

## 🚀 Como Usar em Migrações

### Opção 1: Migração Completa (Do zero)
Use o arquivo `MIGRATION_INIT.sql` - ele cria TODAS as tabelas e popula com dados iniciais.

### Opção 2: Incremento (Banco existente)
1. Execute somente os DDL das tabelas novas
2. Verifique quais tabelas já existem
3. Execute apenas os INSERT dos dados que faltam

### Opção 3: Reset Completo
```sql
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS profissionais CASCADE;
-- Depois execute MIGRATION_INIT.sql
```

---

## 🔐 Notas de Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Chaves extrangeiras com ON DELETE CASCADE onde apropriado
- ✅ Status de agendamentos validado com CHECK constraint
- ✅ Índices criados para performance
- ⚠️ Em produção, considere restringir SELECT public para dados sensíveis

---

## 📞 Contato / Manutenção

**Último atualizado:** 3 de abril de 2026  
**Responsável:** Dev Team (Senior Backend)  
**Próxima revisão:** Quando novos tipos de referências forem adicionados
