# Checklist — pré-requisitos mobile (Etapa 0+)

Itens necessários para as etapas seguintes do plano Capacitor (Android + iOS).  
Marque conforme for providenciando. **Nada aqui publica o app nas lojas automaticamente.**

## Contas e plataformas

| Item | Status | Observação |
|------|--------|------------|
| Apple Developer Program (US$ 99/ano) | Pendente | Obrigatório para App Store / TestFlight / CI iOS |
| App Store Connect (app + API Key) | Pendente | API Key para Codemagic na Etapa 7 |
| Google Play Console (~US$ 25 único) | Pendente | Conta / organização verificada |
| Codemagic (ou CI macOS equivalente) | Pendente | Builds iOS sem Mac local |
| OneSignal (apps Android + iOS) | Pendente | Ou preferência por Firebase-only (Etapa 5) |

## Identidade do app

| Item | Valor | Status |
|------|-------|--------|
| Bundle ID / Application ID | `br.com.fisionotes.app` | **Aprovado** |
| Nome de exibição | Fisionotes | OK |

## Jurídico e lojas

| Item | Status | Observação |
|------|--------|------------|
| Política de Privacidade (URL) | Em código: `/privacidade` | Revisar texto juridicamente; deploy web sob aprovação |
| Termos de Uso (URL) | Em código: `/termos` | Idem |
| E-mail / telefone de suporte nas lojas | Pendente | |
| Decisão billing SaaS **A / B / C** | **B escolhida** | StoreKit + Play Billing + Stripe web — ver `docs/etapa-3-billing-b.md` |
| Assets ícone 1024 + splash | Pendente | |
| iPhone físico para TestFlight / Daily | **Disponível** | Confirmado |

## Deep links (Etapa 2)

| Item | Status |
|------|--------|
| Arquivos `/.well-known/apple-app-site-association` e `assetlinks.json` no repo | Feito (placeholders) |
| Substituir `APPLE_TEAM_ID` no AASA | Pendente (seu Team ID Apple) |
| Substituir `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` | Pendente (Play App Signing) |
| OK para publicar well-known em produção (Netlify) | Pendente (aprovação explícita) |
| Associated Domains + App Links no binário | Feito no projeto nativo |

## Gate de produção

| Item | Regra |
|------|--------|
| Deploy produção / submit lojas | Somente com aprovação explícita |
| Alterações irreversíveis (DNS, secrets produção) | Somente com aprovação explícita |

## Decisão de billing

- ~~A — Companion estrito~~
- **B — StoreKit + Play Billing + Stripe web** ← escolhida
- ~~C — Só B2B organizacional~~
