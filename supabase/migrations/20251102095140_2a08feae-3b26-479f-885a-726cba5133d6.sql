-- Corrigir search_path da função update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar triggers
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();