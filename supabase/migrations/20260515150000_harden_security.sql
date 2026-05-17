-- Harden: pin search_path on trigger function (advisor 0011)
CREATE OR REPLACE FUNCTION trigger_set_fecha_edicion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.fecha_edicion = now();
  RETURN NEW;
END;
$$;

-- Harden: revoke EXECUTE on Supabase's rls_auto_enable() from clients (advisors 0028/0029).
-- It is an event-trigger function meant to be invoked by the system, not by API users.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
