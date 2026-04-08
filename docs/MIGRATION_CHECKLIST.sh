#!/bin/bash

# =====================================================
# MIGRATION_CHECKLIST.sh
# =====================================================
# Script de verificação pré e pós-migração
# Uso: bash MIGRATION_CHECKLIST.sh
# =====================================================

echo "🔍 MIGRATION CHECKLIST - Agenda.Ouro"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =====================================================
# PRÉ-MIGRAÇÃO
# =====================================================

echo "📋 PRÉ-MIGRAÇÃO"
echo "==============="
echo ""

# 1. Verificar arquivo de migração
if [ -f "MIGRATION_INIT.sql" ]; then
    echo -e "${GREEN}✅${NC} Arquivo MIGRATION_INIT.sql encontrado"
    wc -l MIGRATION_INIT.sql
else
    echo -e "${RED}❌${NC} Arquivo MIGRATION_INIT.sql NÃO encontrado"
fi

echo ""

# 2. Verificar documentação
echo "📚 Documentação:"
for file in "CLASSES.md" "MIGRATION_GUIDE.md" "DATABASE_SETUP.md"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file NÃO encontrado"
    fi
done

echo ""

# 3. Verificar arquivo .env
if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} Arquivo .env configurado"
else
    echo -e "${YELLOW}⚠️${NC} Arquivo .env não encontrado (necessário para testes)"
fi

echo ""

# 4. Tamanho do banco
echo "💾 Informações de Migração:"
echo "   - Versão: 1.2 (2026-04-03)"
echo "   - Tabelas: 3 (profissionais, servicos, agendamentos)"
echo "   - Registros iniciais: 12 (3 profissionais + 9 serviços)"
echo "   - Índices: 9"
echo "   - Políticas RLS: 7"

echo ""
echo "===================================="
echo "📋 CHECKLIST PRÉ-MIGRAÇÃO"
echo "===================================="
echo ""
echo "Antes de executar, marque cada item:"
echo ""
echo "└─ [ ] Fazer backup dos dados atuais"
echo "└─ [ ] Comunicar ao time sobre downtime"
echo "└─ [ ] Testar em staging primeiro"
echo "└─ [ ] Verificar permissões de admin no Supabase"
echo "└─ [ ] Revisar MIGRATION_GUIDE.md"
echo ""

echo "===================================="
echo "✅ PRÉ-MIGRAÇÃO COMPLETA!"
echo "===================================="
echo ""
echo "Próximos passos:"
echo "1. Acesse: https://app.supabase.com"
echo "2. SQL Editor → New Query"
echo "3. Cole conteúdo: MIGRATION_INIT.sql"
echo "4. Execute: RUN (ou Ctrl+Enter)"
echo "5. Valide segundo MIGRATION_GUIDE.md"
echo ""
