/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SITE_URL?: string
  readonly VITE_WHATSAPP_PHONE?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_REVENUECAT_IOS_API_KEY?: string
  readonly VITE_REVENUECAT_ANDROID_API_KEY?: string
  readonly VITE_REVENUECAT_ENTITLEMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
