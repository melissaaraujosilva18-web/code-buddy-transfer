-- Adicionar campo para controlar uso do cupom
ALTER TABLE public.profiles 
ADD COLUMN coupon_used boolean NOT NULL DEFAULT false;