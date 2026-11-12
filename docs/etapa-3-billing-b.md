# Etapa 3 — Billing Opção B (planejamento)

**Decisão confirmada (2026-11-12):** Opção **B** — StoreKit (iOS) + Google Play Billing (Android) + Stripe no site.

## Objetivo

O fisioterapeuta pode assinar/renovar o plano SaaS:

- **Web:** Stripe Checkout / Customer Portal (fluxo atual)
- **iOS app:** In-App Purchase (StoreKit auto-renewable)
- **Android app:** Google Play Billing subscriptions

Pacotes/sessões do **paciente** continuam via Stripe (serviço real / person-to-person) — Browser + deep link de retorno.

## Fonte de verdade

Supabase (`physiotherapists.subscription_status` / trial / etc.) atualizado por:

1. Webhooks Stripe (já existentes)
2. Validação server-side de recibos Apple / Play (Edge Functions novas)
3. Opcionalmente **RevenueCat** para unificar StoreKit + Play + webhooks

## Escopo técnico previsto (não implementar nesta Etapa 2)

1. Produtos de assinatura no App Store Connect e Play Console (espelho do `SAAS_PLAN`)
2. Integração client Capacitor / StoreKit / Play Billing (ou SDK RevenueCat)
3. Edge Functions: verify + sync entitlement → mesmo status usado por `canManagePractice`
4. UI nativa de paywall no app; manter Stripe na web
5. Paridade de preço e trial (7 dias) entre canais
6. Notas de App Review / Play Data safety alinhadas ao modelo B

## Fora do escopo da Opção B

- Remover Stripe da web
- Vender pacotes de paciente via IAP

## Pré-requisitos seus antes de codar a Etapa 3

- Contas Apple Developer + Play Console ativas
- Decisão RevenueCat vs implementação manual
- Confirmação de preço/trial idênticos nas lojas
