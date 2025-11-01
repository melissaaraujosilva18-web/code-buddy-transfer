-- Criar tabela para armazenar configurações da API de jogos
CREATE TABLE IF NOT EXISTS public.game_api_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT,
  operator_token TEXT,
  provider_code TEXT DEFAULT 'PS',
  rtp INTEGER DEFAULT 96 CHECK (rtp >= 85 AND rtp <= 99),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_api_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver e gerenciar as configurações
CREATE POLICY "Admins can view API settings"
  ON public.game_api_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update API settings"
  ON public.game_api_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert API settings"
  ON public.game_api_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Criar um registro inicial
INSERT INTO public.game_api_settings (api_key, operator_token, provider_code, rtp)
VALUES ('', '', 'PS', 96)
ON CONFLICT DO NOTHING;