-- INSERT ... RETURNING applies SELECT policies to the new row.
-- private.physio_has_patient(id) looks the row up again and can miss the
-- in-progress INSERT, so .insert().select() fails with RLS 42501 even when
-- patients_insert WITH CHECK passed. Allow ownership via column values.

DROP POLICY IF EXISTS "patients_select" ON public.patients;
CREATE POLICY "patients_select" ON public.patients
  FOR SELECT USING (
    profile_id = (SELECT auth.uid())
    OR private.is_admin()
    OR (
      private.get_user_role() = 'physiotherapist'
      AND physiotherapist_id = private.get_physiotherapist_id_for_user()
    )
    OR private.physio_has_patient(id)
    OR private.caregiver_has_patient(id)
  );

-- Keep RLS write gate aligned with app canManagePractice (active + live trial).
CREATE OR REPLACE FUNCTION private.physio_has_active_subscription()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.physiotherapists p
    WHERE p.profile_id = auth.uid()
      AND (
        p.subscription_status = 'active'
        OR (
          p.subscription_status = 'trialing'
          AND (p.trial_ends_at IS NULL OR p.trial_ends_at > now())
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.physio_has_active_subscription() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.physio_has_active_subscription() TO authenticated;
