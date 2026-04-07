# 🗂️ Índice de Arquivos - Banco de Dados Agenda.Ouro

> Guia rápido para encontrar tudo que você precisa saber sobre a estrutura do banco de dados.

## 📁 Mapa de Arquivos

```
/
├── 🗄️ BANCO DE DADOS
│   ├── MIGRATION_INIT.sql          ⭐ PRINCIPAL - Execute este para migrar
│   ├── MIGRATION_CHECKLIST.sh       🔍 Verificar antes/depois da migração
│   ├── schema.json                  📊 Schema em formato JSON (machine-readable)
│   └── DATABASE_SETUP.md            📖 Histórico (v1.0 - referência)
│
├── 📚 DOCUMENTAÇÃO
│   ├── CLASSES.md                   📋 Estrutura completa de todas as tabelas
│   └── MIGRATION_GUIDE.md           🚀 Instruções passo a passo
│
└── 💾 APLICAÇÃO
    ├── src/components/AdminDashboard.jsx
    ├── src/components/BookingForm.jsx
    └── create_servicos_table.sql    (arquivo anterior - já incluído em MIGRATION_INIT.sql)
```

---

## 🎯 Por Uso

### 🚀 "Quero Migrar o Banco Agora"
1. Leia: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) (5 min)
2. Execute: [MIGRATION_INIT.sql](MIGRATION_INIT.sql)
3. Valide: Seguindo instruções em [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

### 📋 "Quero Entender a Estrutura"
1. Leia: [CLASSES.md](CLASSES.md) - Documentação completa
2. Veja: ER Diagram em [CLASSES.md](CLASSES.md)
3. Consulte: Relacionamentos em [schema.json](schema.json)

### ⚙️ "Preciso Adicionar uma Nova Tabela"
1. Leia: [CLASSES.md](CLASSES.md) - Padrão usado
2. Atual: [MIGRATION_INIT.sql](MIGRATION_INIT.sql) - Aprenda a estrutura
3. Adicione a tabela no script
4. Atualize: [CLASSES.md](CLASSES.md) com a nova documentação

### 🐛 "Algo deu errado com a migração"
1. Consulte: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Seção Troubleshooting
2. Valide: Usando comandos em [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
3. Execute: [MIGRATION_CHECKLIST.sh](MIGRATION_CHECKLIST.sh) para diagnóstico

### 🔍 "Preciso de um backup do schema"
1. Exporte: [schema.json](schema.json) - Backup estruturado
2. Use: [MIGRATION_INIT.sql](MIGRATION_INIT.sql) para recrear tudo
3. Valide: Com [MIGRATION_CHECKLIST.sh](MIGRATION_CHECKLIST.sh)

---

## 📊 Versão Atual

```
┌─────────────────────────────────────────┐
│       SCHEMA VERSÃO 1.2                 │
│    (Última atualização: 3 de abr)       │
├─────────────────────────────────────────┤
│                                         │
│  ✅ 3 Tabelas                          │
│  ✅ 28 Campos                          │
│  ✅ 9 Índices                          │
│  ✅ 7 Políticas RLS                    │
│  ✅ 2 Relacionamentos (FK)             │
│  ✅ 12 Registros Iniciais              │
│                                         │
└─────────────────────────────────────────┘
```

### Tabelas

| Tabela | Registros | Status | Docs |
|--------|-----------|--------|------|
| **profissionais** | 3 | ✅ | [CLASSES.md](CLASSES.md#profissionais) |
| **servicos** | 9 | ✅ | [CLASSES.md](CLASSES.md#serviços) |
| **agendamentos** | 0 | ✅ | [CLASSES.md](CLASSES.md#agendamentos) |

---

## ⚡ Quick Commands

### Migração Completa (O que você quer fazer?)

```bash
# 1. Copiar o conteúdo do arquivo
cat MIGRATION_INIT.sql

# 2. No Supabase Dashboard:
# - SQL Editor → New Query
# - PASTE do comando acima
# - RUN (Ctrl+Enter)

# 3. Validar
bash MIGRATION_CHECKLIST.sh
```

### Ver Schema em JSON
```bash
cat schema.json | less
```

### Fazer Backup
```bash
# Exportar estrutura
cat MIGRATION_INIT.sql > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📖 Documentação Completa

### Ordem Recomendada de Leitura

1. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** ← Comece aqui (15 min)
   - Visão geral rápida
   - Guia passo a passo
   - Troubleshooting

2. **[CLASSES.md](CLASSES.md)** ← Depois leia isto (10 min)
   - Estrutura de todas as tabelas
   - ER Diagram visual
   - Histórico de versões

3. **[schema.json](schema.json)** ← Para referência
   - Machine-readable format
   - Integração com ferramentas
   - Metadados completos

4. **[MIGRATION_INIT.sql](MIGRATION_INIT.sql)** ← Para implementar (1 min)
   - Execute direto
   - Bem comentado
   - Idempotente

---

## 🔄 Fluxo de Evolução do Schema

```
v1.0 (2026-04-03)
└─ DATABASE_SETUP.md
   ├─ profissionais (3 regr)
   └─ agendamentos (0 regr)
        │
        ▼
v1.1 (2026-04-03)
└─ create_servicos_table.sql
   └─ servicos (9 regr)
        │
        ▼
v1.2 (2026-04-03) ← ATUAL
└─ MIGRATION_INIT.sql
   ├─ profissionais (3 regr)
   ├─ servicos (9 regr)
   ├─ agendamentos (0 regr)
   └─ 9 índices + 7 políticas RLS
```

---

## 🚀 Próximas Funcionalidades

Se precisar adicionar novas tabelas:

1. ✍️ Atualize: [CLASSES.md](CLASSES.md)
2. ✍️ Atualize: [MIGRATION_INIT.sql](MIGRATION_INIT.sql)
3. ✍️ Atualize: [schema.json](schema.json)
4. 📝 Atualize: Versão para v1.3
5. 🧪 Execute: [MIGRATION_INIT.sql](MIGRATION_INIT.sql) em staging
6. ✅ Valide: Com [MIGRATION_CHECKLIST.sh](MIGRATION_CHECKLIST.sh)

---

## 📞 Manutenção

| Arquivo | Atualizar quando | Responsável |
|---------|-----------------|-------------|
| MIGRATION_INIT.sql | Nova tabela/campo | Backend |
| CLASSES.md | Estrutura muda | Backend |
| MIGRATION_GUIDE.md | Novo cenário | Arquitetura |
| schema.json | Schema muda | Backend |

---

## ✅ Checklist de Status

- [x] Schema v1.2 estável
- [x] Documentação completa
- [x] Script de migração pronto
- [x] Dados iniciais carregados
- [x] RLS configurado
- [x] Índices criados
- [x] Validação pronta

---

**Última atualização:** 3 de abril de 2026  
**Versão do Schema:** 1.2  
**Mantido por:** Dev Team (Senior Backend)

👉 **Comece em:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
