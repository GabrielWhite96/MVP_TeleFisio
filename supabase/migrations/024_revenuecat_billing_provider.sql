-- Etapa 3: dual billing (Stripe web + RevenueCat stores) with a single entitlement column.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'saas_billing_provider'
  ) THEN
    CREATE TYPE public.saas_billing_provider AS ENUM ('stripe', 'revenuecat');
  END IF;
END $$;

ALTER TABLE public.physiotherapists
  ADD COLUMN IF NOT EXISTS billing_provider public.saas_billing_provider,
  ADD COLUMN IF NOT EXISTS revenuecat_app_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_physiotherapists_revenuecat_app_user
  ON public.physiotherapists (revenuecat_app_user_id)
  WHERE revenuecat_app_user_id IS NOT NULL;

COMMENT ON COLUMN public.physiotherapists.billing_provider IS
  'Owns the current SaaS subscription channel: stripe (web) or revenuecat (App Store / Play).';
COMMENT ON COLUMN public.physiotherapists.revenuecat_app_user_id IS
  'RevenueCat app_user_id; normally equals profiles.id (auth uid).';

-- Backfill RC app user id for existing physios (idempotent).
UPDATE public.physiotherapists
SET revenuecat_app_user_id = profile_id::text
WHERE revenuecat_app_user_id IS NULL;

-- Protect new billing columns from client self-writes (service_role / admin only).
CREATE OR REPLACE FUNCTION public.protect_physiotherapist_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' OR private.is_admin() THEN
    RETURN NEW;
  END IF;

  NEW.subscription_status := OLD.subscription_status;
  NEW.trial_ends_at := OLD.trial_ends_at;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.billing_provider := OLD.billing_provider;
  NEW.revenuecat_app_user_id := OLD.revenuecat_app_user_id;
  RETURN NEW;
END;
$$;

-- Allow RevenueCat-provisioned physio accounts (same gate as stripe_saas).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_full_name TEXT;
  v_invite_token TEXT;
  v_invite patient_invites%ROWTYPE;
  v_meta_role TEXT;
  v_provisioned_by TEXT;
  v_provision_token TEXT;
  v_email_allowed BOOLEAN := FALSE;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';
  v_meta_role := NEW.raw_user_meta_data->>'role';
  v_provisioned_by := COALESCE(NEW.raw_app_meta_data->>'provisioned_by', '');
  v_provision_token := COALESCE(NEW.raw_user_meta_data->>'provision_token', '');

  IF v_invite_token IS NOT NULL AND length(v_invite_token) > 0 THEN
    SELECT * INTO v_invite
    FROM patient_invites
    WHERE invite_token = v_invite_token
      AND status = 'pending'
      AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired patient invite';
    END IF;

    IF lower(v_invite.email) <> lower(NEW.email) THEN
      RAISE EXCEPTION 'Invite email does not match signup email';
    END IF;

    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
      NEW.id,
      'patient',
      COALESCE(v_full_name, (SELECT full_name FROM patients WHERE id = v_invite.patient_id)),
      NULL
    );

    UPDATE public.patients
    SET
      profile_id = NEW.id,
      account_status = 'active',
      full_name = COALESCE(patients.full_name, v_full_name),
      email = COALESCE(patients.email, NEW.email),
      updated_at = now()
    WHERE id = v_invite.patient_id;

    UPDATE public.patient_invites
    SET
      status = 'accepted',
      accepted_at = now(),
      accepted_profile_id = NEW.id,
      updated_at = now()
    WHERE id = v_invite.id;

    INSERT INTO public.care_relationships (patient_id, physiotherapist_id)
    VALUES (v_invite.patient_id, v_invite.physiotherapist_id)
    ON CONFLICT (patient_id, physiotherapist_id) DO UPDATE
      SET ended_at = NULL, updated_at = now();

    RETURN NEW;
  END IF;

  IF v_meta_role = 'caregiver' THEN
    IF EXISTS (
      SELECT 1 FROM caregiver_invites ci
      WHERE lower(ci.email) = lower(NEW.email)
        AND ci.status = 'pending'
        AND ci.expires_at > now()
    ) THEN
      INSERT INTO public.profiles (id, role, full_name)
      VALUES (NEW.id, 'caregiver', v_full_name);
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Caregiver signup requires a valid invite';
  END IF;

  IF v_provision_token <> '' THEN
    SELECT TRUE
      INTO v_email_allowed
    FROM private.stripe_physio_provision a
    WHERE a.email = lower(NEW.email)
      AND a.token::text = v_provision_token
      AND a.expires_at > now();
  END IF;

  IF v_provisioned_by NOT IN ('stripe_saas', 'revenuecat_saas')
     AND NOT COALESCE(v_email_allowed, FALSE) THEN
    RAISE EXCEPTION 'Professional accounts are created after subscription payment';
  END IF;

  v_role := 'physiotherapist';

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, v_role, v_full_name);

  INSERT INTO public.physiotherapists (
    profile_id,
    modalities,
    subscription_status,
    trial_ends_at,
    revenuecat_app_user_id
  )
  VALUES (
    NEW.id,
    ARRAY['telehealth', 'home_visit']::appointment_modality[],
    'inactive',
    NULL,
    NEW.id::text
  );

  DELETE FROM private.stripe_physio_provision
  WHERE email = lower(NEW.email);

  RETURN NEW;
END;
$$;
