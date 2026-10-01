-- Daily in-app reminders. Same work as the send-reminders Edge Function.
-- Window is the next 25 hours so one run per day still catches tomorrow's appointments.
-- Patients without an account are skipped (notifications.user_id is required).

CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT a.id, a.scheduled_at, p.profile_id AS patient_profile, ph.profile_id AS physio_profile
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN physiotherapists ph ON ph.id = a.physiotherapist_id
    WHERE a.status IN ('scheduled', 'confirmed')
      AND a.scheduled_at > now()
      AND a.scheduled_at <= now() + interval '25 hours'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.metadata->>'appointment_id' = a.id::text
          AND n.type = 'appointment_reminder'
      )
  LOOP
    IF r.patient_profile IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, metadata)
      VALUES (
        r.patient_profile,
        'appointment_reminder',
        'Lembrete de consulta',
        'Sua consulta é amanhã.',
        jsonb_build_object('appointment_id', r.id)
      );
    END IF;

    IF r.physio_profile IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, metadata)
      VALUES (
        r.physio_profile,
        'appointment_reminder',
        'Lembrete de consulta',
        'Consulta nas próximas 24 horas.',
        jsonb_build_object('appointment_id', r.id)
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_scheduled_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.send_appointment_reminders();
  PERFORM public.send_evaluation_reminders();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_appointment_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_scheduled_reminders() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-daily') THEN
    PERFORM cron.unschedule('send-reminders-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'send-reminders-daily',
  '0 12 * * *',
  $$SELECT public.run_scheduled_reminders()$$
);
