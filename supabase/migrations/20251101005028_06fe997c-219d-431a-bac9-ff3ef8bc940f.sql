-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  has_deposited BOOLEAN DEFAULT FALSE NOT NULL,
  bonus_claimed BOOLEAN DEFAULT FALSE NOT NULL,
  pix_key TEXT,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random')),
  pix_name TEXT,
  withdrawal_status TEXT CHECK (withdrawal_status IN ('processing', 'awaiting_fee')),
  withdrawal_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de transações
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de apostas/bets
CREATE TABLE public.game_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_code TEXT NOT NULL,
  game_name TEXT NOT NULL,
  bet_amount DECIMAL(10, 2) NOT NULL,
  win_amount DECIMAL(10, 2) DEFAULT 0,
  multiplier DECIMAL(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'playing',
  game_session_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_bets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Transactions RLS policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game bets RLS policies
CREATE POLICY "Users can view their own bets"
  ON public.game_bets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets"
  ON public.game_bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets"
  ON public.game_bets FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_profiles_blocked ON public.profiles(blocked);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_game_bets_user_id ON public.game_bets(user_id);
CREATE INDEX idx_game_bets_status ON public.game_bets(status);
CREATE INDEX idx_game_bets_created_at ON public.game_bets(created_at DESC);
CREATE INDEX idx_game_bets_started_at ON public.game_bets(started_at DESC);

-- Função para processar aposta
CREATE OR REPLACE FUNCTION public.process_game_bet(
  p_user_id UUID,
  p_game_code TEXT,
  p_game_name TEXT,
  p_bet_amount DECIMAL(10, 2),
  p_game_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_bet_id UUID;
BEGIN
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance < p_bet_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Saldo insuficiente',
      'current_balance', v_current_balance
    );
  END IF;

  v_new_balance := v_current_balance - p_bet_amount;

  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, metadata)
  VALUES (
    p_user_id,
    'bet',
    -p_bet_amount,
    v_current_balance,
    v_new_balance,
    'Aposta em ' || p_game_name,
    jsonb_build_object('game_code', p_game_code, 'game_name', p_game_name)
  );

  INSERT INTO game_bets (user_id, game_code, game_name, bet_amount, game_session_url)
  VALUES (p_user_id, p_game_code, p_game_name, p_bet_amount, p_game_url)
  RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'new_balance', v_new_balance,
    'game_url', p_game_url
  );
END;
$$;

-- Função para processar ganho
CREATE OR REPLACE FUNCTION public.process_game_win(
  p_bet_id UUID,
  p_win_amount DECIMAL(10, 2),
  p_multiplier DECIMAL(10, 2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_game_name TEXT;
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
BEGIN
  SELECT user_id, game_name
  INTO v_user_id, v_game_name
  FROM game_bets
  WHERE id = p_bet_id;

  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + p_win_amount;

  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = v_user_id;

  UPDATE game_bets
  SET
    win_amount = p_win_amount,
    multiplier = p_multiplier,
    status = 'won',
    finished_at = now()
  WHERE id = p_bet_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, metadata)
  VALUES (
    v_user_id,
    'win',
    p_win_amount,
    v_current_balance,
    v_new_balance,
    'Ganho em ' || v_game_name,
    jsonb_build_object('bet_id', p_bet_id, 'multiplier', p_multiplier)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;