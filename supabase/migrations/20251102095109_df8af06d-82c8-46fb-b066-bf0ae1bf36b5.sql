-- Criar tabela de provedores (providers)
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rtp INTEGER DEFAULT 96,
  distribution TEXT DEFAULT 'evergame',
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de jogos (games)
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_code TEXT NOT NULL,
  game_name TEXT NOT NULL,
  technology TEXT DEFAULT 'html5',
  distribution TEXT DEFAULT 'evergame',
  rtp INTEGER DEFAULT 96,
  cover TEXT,
  status BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'slot',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_code, distribution)
);

-- Adicionar campos extras em game_api_settings
ALTER TABLE public.game_api_settings 
ADD COLUMN IF NOT EXISTS callback_url TEXT,
ADD COLUMN IF NOT EXISTS win_probability INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS bonus_probability INTEGER DEFAULT 2;

-- Habilitar RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para providers
CREATE POLICY "Admins can manage providers"
ON public.providers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active providers"
ON public.providers
FOR SELECT
TO authenticated
USING (status = true);

-- Políticas RLS para games
CREATE POLICY "Admins can manage games"
ON public.games
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active games"
ON public.games
FOR SELECT
TO authenticated
USING (status = true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_games_provider_id ON public.games(provider_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_games_distribution ON public.games(distribution);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();