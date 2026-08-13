# TeleFisio — MVP

Plataforma de tele-fisioterapia e reabilitação domiciliar para o mercado canadense.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Storage-ready)
- **Arquitetura:** Feature-Sliced Design

## Pré-requisitos

- Node.js 20+
- Conta Supabase (projeto criado)
- Supabase CLI (opcional, para migrations locais)

## Setup local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd MVP_TeleFisio
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha no `.env`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Aplicar migrations no Supabase

Via Supabase CLI (linkado ao seu projeto):

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Ou copie e execute os arquivos SQL em `supabase/migrations/` na ordem (001 → 015) no SQL Editor do Supabase Dashboard.

### 4. Criar usuário administrador

1. Cadastre-se pela interface (`/auth/signup`)
2. No painel Admin (após o primeiro admin via SQL), use **Promover a admin**, ou:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<uuid-do-usuario>';
```

### 5. Configurar fisioterapeuta (dev)

Após cadastrar um fisioterapeuta, acesse **Perfil profissional** e configure a disponibilidade.

### 6. Executar

```bash
npm run dev
```

Acesse `http://localhost:5173`

## V1.1 — Recovery Journey

Além do fluxo de consulta, o MVP agora inclui:

- Planos de tratamento e metas mensuráveis
- Check-ins 0–10 (dor, mobilidade, confiança)
- Timeline clínica
- Adesão com dificuldade Easy/Moderate/Hard
- Alertas at-risk para o fisioterapeuta
- Reagendamento, cancelamento com motivo e editor de agenda
- Teleconsulta Daily (Edge Function `create-daily-room`; fallback mock)
- Consentimentos no primeiro acesso
- Perfil clínico separado
- Portal do cuidador com permissões granulares
- Checkout Stripe (Edge Function; modo demo se a chave não estiver configurada)
- Auditoria admin e promoção de papéis

Secrets das Edge Functions (Dashboard → Edge Functions → Secrets):

- `DAILY_API_KEY`, `DAILY_DOMAIN` (opcional)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (opcional)


## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run test` | Testes (Vitest) |
| `npm run test:e2e` | E2E Playwright |
| `npm run typecheck` | Verificação TypeScript |
| `npm run lint` | ESLint |

## Estrutura do projeto

```
src/
├── app/           # Router, providers
├── pages/         # Páginas (rotas finas)
├── widgets/       # Layout, dashboard widgets
├── features/      # auth, booking, clinical, exercises
├── entities/      # patient, appointment, physio, exercise APIs
└── shared/        # UI, config, providers, types, lib

supabase/
└── migrations/    # SQL versionado (enums, tables, RLS, triggers)
```

## Fluxos do MVP

### Paciente
Cadastro → Login → Agendar (modalidade → fisio → horário) → Dashboard → Consulta → Exercícios

### Fisioterapeuta
Login → Dashboard/Agenda → Atendimento → Prontuário → Prescrição de exercícios

### Admin
Dashboard com métricas → Usuários → Consultas

## Segurança

- **RLS** habilitado em todas as tabelas
- Roles armazenados em `profiles.role` (não em `user_metadata`)
- Dados clínicos separados em `clinical_records`
- Audit log via `audit_logs` + `log_audit_event()`
- Vínculo paciente-fisio via `care_relationships`

## Funcionalidades futuras (ainda não implementadas)

- Chat auditável
- Notificações push/SMS
- Mapas e otimização de rotas
- IA clínica
- Apps nativos
- Multi-tenant UI completo

## Testes

```bash
npm run test
```

Cobertura inicial: schemas de auth, booking, permissões, exercícios.

## Licença

MIT
