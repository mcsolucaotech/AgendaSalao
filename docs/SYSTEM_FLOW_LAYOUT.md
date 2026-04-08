# Agenda.Ouro — Documento de Fluxo e Layout do Sistema

> Este documento foi elaborado para orientar qualquer equipe na implementação completa do aplicativo `Agenda.Ouro`, incluindo fluxo de navegação, arquitetura de telas, modelo de dados e comportamentos UX.

## 1. Visão Geral do Produto

Agenda.Ouro é um sistema de agendamento para salão de beleza / profissionais, com foco em:
- login seguro para gestores
- visualização de calendário diário/mensal
- seleção de profissional responsável
- reserva de horários disponíveis em passos
- gestão de agendamentos com busca, filtros, edição e exclusão

### Objetivo
Permitir que gestores e equipes criem, editem e monitorem agendamentos de clientes de forma rápida e visual.

## 2. Personas e Jornadas

### Personas
- `Administrador/Gestor` — acessa o sistema para revisar agenda, gerenciar compromissos e ajustar horários.
- `Recepção` — usa o app para cadastrar clientes e verificar disponibilidade em tempo real.

### Jornadas principais
1. Autenticar no sistema
2. Selecionar o profissional correto
3. Navegar no calendário e escolher um dia
4. Ver agenda do dia
5. Abrir o formulário de agendamento
6. Selecionar serviço, horário e inserir dados do cliente
7. Salvar ou editar agendamento
8. Revisar lista completa de agendamentos e validar status

## 3. Arquitetura de Telas

### 3.1. Tela de Login

- Entrada: e-mail e senha
- Feedback: erro de credenciais e falha de conexão
- Comportamento: ao autenticar, direciona para a tela principal

Componentes principais:
- `Login.jsx`
- `supabase.auth.signInWithPassword`

### 3.2. Tela Principal / Dashboard

Abas:
- `Início` — visão de calendário + agenda do dia
- `Agenda` — lista completa de agendamentos

Componentes principais:
- `App.jsx` (gerencia autenticação e navegação)
- `MainApp` (estado principal, troca de views)
- `CalendarView.jsx`
- `TimeSlotList.jsx`
- `AppointmentsManager.jsx`
- `BookingForm.jsx`

### 3.3. Modal de Agendamento

- passo 1: escolha do serviço
- passo 2: escolha do horário disponível
- passo 3: cadastro do cliente e observações
- validação: nome do cliente obrigatório e horário selecionado
- fluxo de edição: `initialData` preenche o formulário para UPDATE

### 3.4. Lista de Agendamentos

- busca por nome do cliente ou serviço
- filtro `Próximos` / `Todos`
- botão editar e excluir
- confirmação de exclusão

## 4. Fluxo de Navegação

### 4.1. Fluxograma de alto nível

```text
Login -> Dashboard
Dashboard -> [Início | Agenda]
Início -> Seleciona Profissional -> Seleciona Data -> Visualiza Agenda do Dia
Início -> Novo Agendamento -> BookingForm (passo1, passo2, passo3) -> Salvar
Agenda -> Busca/Filtra -> Editar/Excluir Agendamento
```

### 4.2. Estados de UI

- `loading` ao buscar profissionais e agendamentos
- `error` ao falhar conexão ou ao não encontrar dados
- `success` ao salvar agendamento
- `showBookingForm` controla renderização do modal
- `view` controla aba atual (`calendar` / `manager`)

## 5. Modelo de Dados e Backend

### 5.1. Tabelas principais

#### profissionais
- `id: UUID`
- `nome: TEXT`
- `foto_url: TEXT` (opcional)
- `created_at: TIMESTAMP`

#### agendamentos
- `id: UUID`
- `created_at: TIMESTAMP`
- `data_hora: TIMESTAMP` (data e hora da reserva)
- `cliente_nome: TEXT`
- `cliente_telefone: TEXT`
- `servico: TEXT`
- `profissional_id: UUID` (FK para `profissionais`)
- `observacoes: TEXT`
- `status: TEXT` (`Pendente`, `Confirmado`, `Cancelado`, `Finalizado`)

### 5.2. Consultas utilizadas

- `profissionais.select('id, nome')` para lista de profissionais
- `agendamentos.select('data_hora').eq('profissional_id', ...).gte(...).lte(...)` para marcadores do calendário
- `agendamentos.select('*').eq('profissional_id', ...).gte(...).lte(...).order('data_hora')` para agenda do dia
- `agendamentos.insert([payload])` para criar agendamento
- `agendamentos.update(payload).eq('id', id)` para editar
- `agendamentos.delete().eq('id', id)` para excluir

### 5.3. Regras de negócio

- Horários válidos: das 08:00 às 19:00, intervalos de 30 minutos
- Não pode agendar para datas passadas
- Slots ocupados são excluídos da lista de horários disponíveis
- Item em edição mantém seu próprio horário disponível (exceção ao filtrar ocupados)

## 6. Detalhes de Layout e UX

### 6.1. Estilo visual geral

- Paleta: lavanda, cinza, branco e preto sofisticado
- Fonte principal: bold/black para títulos e labels
- Cards arredondados, vidro fosco (`glass`), sombras suaves
- Uso de ícones para reforçar a leitura rápida
- Botões grandes e com feedback de hover / active

### 6.2. Hierarquia de informação

- Header com marca e logout
- Seleção de profissional em destaque
- Calendário mensal com dias clicáveis
- Lista do dia com cards de agendamento
- Botão fixo de criar novo agendamento
- Navegação inferior fixa com duas abas

### 6.3. Responsividade e comportamentos

- Conteúdo centralizado em largura máxima `max-w-xl`
- Navegação inferior fixa em mobile
- Modal de agendamento em overlay com `AnimatePresence`
- Feedback visual para dias com agendamento e o dia atual

## 7. Componentes Principais e suas Responsabilidades

### 7.1. `Login.jsx`
- recebe e-mail e senha
- valida o usuário via Supabase Auth
- exibe mensagens de erro específicas

### 7.2. `MainApp` dentro de `App.jsx`
- gerencia estados globais de `view`, `selectedDate`, `professionalId`
- carrega profissionais ao iniciar
- gerencia abertura do modal de agendamento
- renderiza `CalendarView`, `TimeSlotList` e `AppointmentsManager`

### 7.3. `CalendarView.jsx`
- exibe mês atual
- permite navegação entre meses
- mostra disponibilidade com pontos nos dias
- bloqueia dias passados
- escolhe data para visualizar agendamentos

### 7.4. `TimeSlotList.jsx`
- carrega agendamentos do dia selecionado
- mostra contagem de agendamentos
- exibe placeholder de lista vazia
- ativa botão de novo agendamento

### 7.5. `BookingForm.jsx`
- wizard de 3 passos
- passo 1: seleção de serviço
- passo 2: escolha de hora
- passo 3: dados do cliente e observações
- formata telefone no padrão brasileiro
- cria ou edita agendamento
- mostra estado de `success` e `loading`

### 7.6. `AppointmentsManager.jsx`
- busca agendamentos completos
- filtra por próximos ou todos
- pesquisa por cliente/serviço
- edita e exclui com confirmação

## 8. Proposta de Layouts e Wireframes

### 8.1. Tela de Login

```text
+-----------------------------------------+
| Logo / Marca                            |
| Agenda.Ouro                             |
|-----------------------------------------|
| [E-mail]                                |
| [Senha]                                 |
| [Entrar no Sistema]                     |
| Mensagem de erro                        |
+-----------------------------------------+
```

### 8.2. Tela Início (Calendário)

```text
+-------------------------------------------------+
| Header: marca + logout                           |
| Seletor de profissional                          |
|                                                 |
| [ Mês atual ]  <  calendário  >                 |
|  D  S  T  Q  Q  S  S                            |
| 01 02 03 ...                                     |
|                                                 |
| Cartão de agenda do dia                          |
| - Data e contagem                                |
| - Lista de agendamentos                          |
|                                                 |
| + Novo Agendamento (botão fixo)                  |
+-------------------------------------------------+
```

### 8.3. Tela Agenda

```text
+-------------------------------------------------+
| Busca / filtro                                  |
| [Buscar por cliente ou serviço] [Próximos/ Todos]|
|                                                 |
| Card de agendamento 1                            |
| Card de agendamento 2                            |
| ...                                             |
+-------------------------------------------------+
```

### 8.4. Modal de Booking

```text
+-------------------------------------------+
| Passo 1: Selecionar serviço               |
| [Corte Masculino] [Escova] [...]          |
|                                           |
| Passo 2: Selecionar horário               |
| [08:00] [08:30] [09:00]                   |
|                                           |
| Passo 3: Dados do cliente                 |
| Nome, Telefone, Observações               |
|                                           |
| [Salvar]                                  |
+-------------------------------------------+
```

## 9. Anexos

### 9.1. Anexo A — Diagrama de componentes

- `App.jsx`
  - `ErrorBoundary`
  - `Login`
  - `MainApp`
    - `CalendarView`
    - `TimeSlotList`
    - `AppointmentsManager`
    - `BookingForm`

### 9.2. Anexo B — Proposta de naming convention

- Páginas/Telas: `Login`, `Dashboard`, `Agenda`
- Componentes: `CalendarView`, `TimeSlotList`, `BookingForm`, `AppointmentsManager`
- Estados: `loading`, `error`, `selectedDate`, `showBookingForm`, `editingAppointment`

### 9.3. Anexo C — Recomendações de UX

- manter `logout` sempre visível
- preservar a seleção de profissional ao navegar entre abas
- exibir mensagens claras de erro e sucesso
- usar animações suaves apenas para reforçar ações
- oferecer confirmação antes de excluir agendamento

### 9.4. Anexo D — Placeholder para prints

> Substitua estes links por capturas de tela reais quando disponíveis.

- Tela de Login: `![Login](./screenshots/login.png)`
- Tela de Calendário: `![Calendário](./screenshots/calendar.png)`
- Modal de Agendamento: `![Booking Form](./screenshots/booking-form.png)`
- Tela Agenda: `![Agenda](./screenshots/agenda.png)`

## 10. Implementação para a equipe

### 10.1. Passos recomendados

1. Criar o layout da tela de login conforme `Login.jsx`.
2. Configurar autenticação Supabase.
3. Implementar a navegação interna do `MainApp` com estado de aba.
4. Conectar `CalendarView` e `TimeSlotList` ao modelo de dados.
5. Implementar `BookingForm` como wizard de 3 passos.
6. Criar `AppointmentsManager` com busca, filtro e ações.
7. Validar regras de negócio no backend e no front-end.
8. Adicionar feedback visual e estados de erro / loading.

### 10.2. Checklist mínimos para jornada completa

- [ ] Login funcional
- [ ] Seleção de profissional
- [ ] Calendário navegável
- [ ] Agenda do dia atualizada
- [ ] Criação de agendamento
- [ ] Edição de agendamento
- [ ] Exclusão com confirmação
- [ ] Busca e filtro de agendamentos
- [ ] Deploy como página estática (GitHub Pages, se necessário)

---

> Este documento é um guia completo para a implementação de `Agenda.Ouro` por qualquer equipe. Ele traz os principais fluxos UX, estrutura de componentes, modelo de dados e recomendações de qualidade.
