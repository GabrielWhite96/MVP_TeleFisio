# Relatório — Etapas 4 + 6 + assets (sem contas de loja)

Branch: `feat/capacitor-etapas-4-6-polish`

## Feito neste ciclo

### A — Ícones e splash
- Fonte: branding (`public/logos/logo_semfundo_sem_nome.png` + verde da marca)
- `resources/` + `npm run assets:generate` → mipmaps Android + AppIcon/Splash iOS
- Checklist: `docs/mobile-prerequisites.md` (ícone/splash: Feito)

### B — Etapa 4 (Daily + PDF)
- Android: `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`
- iOS: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription` (PT)
- Capacitor iOS: `mediaPlaybackRequiresUserAction: false` (Daily iframe)
- PDF nativo: `@capacitor/share` + `@capacitor/filesystem` via `shareOrDownloadFile`
- Web: download clássico preservado

### C — Etapa 6 (biometria + polish)
- `@aparajita/capacitor-biometric-auth` + `@capacitor/preferences`
- Flag `biometric_enabled` apenas (sem senha no device)
- Toggle em perfis paciente/fisio; limpa no `signOut`
- Gate de unlock no cold start (`BiometricGate`)
- Blur PHI em background (`NativePrivacyBlur`) + `getSession` no resume
- Safe-area: `viewport-fit=cover` (já existia) + `safe-area-inset-top` no header mobile
- iOS: `NSFaceIDUsageDescription`

## Dependências novas
- `@capacitor/share`, `@capacitor/filesystem`, `@capacitor/preferences`
- `@aparajita/capacitor-biometric-auth`
- (assets, já no ciclo anterior) `@capacitor/assets`

## Validação
- `npm test` — 107 passed
- `npm run typecheck` — ok
- `npm run build` — ok
- `npx cap sync` — 10 plugins Android/iOS (incl. biometric, share, filesystem, preferences)
- Daily real **Android**: desejável em emulador/device (código + permissões prontos)
- Daily real **iOS**: pendente até Apple Developer + build assinado

## Fora deste ciclo (suas pendências)
1. Pagar Apple Developer + Play Console  
2. `.p8` / Play service account no RevenueCat  
3. Codemagic + signing → TestFlight / internal  
4. Validar Daily no iPhone  
5. Etapa 5 push (quando quiser)  
6. Submit lojas com OK explícito  
7. Team ID / SHA produção nos well-known  
