-- Add secret_key column to game_api_settings
ALTER TABLE game_api_settings 
ADD COLUMN IF NOT EXISTS secret_key TEXT;