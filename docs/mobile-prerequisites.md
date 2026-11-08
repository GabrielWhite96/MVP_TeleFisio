# Checklist — pré-requisitos mobile (Etapa 0)

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

| Item | Valor proposto | Status |
|------|----------------|--------|
| Bundle ID / Application ID | `br.com.fisionotes.app` | Confirmar antes de Etapa 1 avançada / re-gerar nativo |
| Nome de exibição | Fisionotes | OK |

## Jurídico e lojas

| Item | Status | Observação |
|------|--------|------------|
| Política de Privacidade (URL) | Em código: `/privacidade` | Revisar texto juridicamente; deploy web sob aprovação |
| Termos de Uso (URL) | Em código: `/termos` | Idem |
| E-mail / telefone de suporte nas lojas | Pendente | |
| Decisão billing SaaS **A / B / C** | Pendente | **Obrigatória antes da Etapa 3** |
| Assets ícone 1024 + splash | Pendente | |
| iPhone físico para TestFlight / Daily | Pendente | |

## Deep links (Etapa 2+)

| Item | Status |
|------|--------|
| OK para publicar `/.well-known/apple-app-site-association` | Pendente |
| OK para publicar `/.well-known/assetlinks.json` | Pendente |
| Team ID Apple + SHA-256 do cert Android (para assetlinks) | Pendente |

## Gate de produção

| Item | Regra |
|------|--------|
| Deploy produção / submit lojas | Somente com aprovação explícita |
| Alterações irreversíveis (DNS, secrets produção) | Somente com aprovação explícita |

## Decisão de billing (resumo)

- **A** — Companion estrito (sem venda SaaS no app; Stripe só na web)
- **B** — StoreKit + Play Billing + Stripe web (recomendado se o app vender assinatura)
- **C** — Só B2B organizacional (muda go-to-market)

Escolher **antes** da Etapa 3.
