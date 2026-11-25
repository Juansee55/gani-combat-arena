CREATE TABLE public.player_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Jugador',
  x real NOT NULL DEFAULT 776,
  y real NOT NULL DEFAULT 840,
  dir text NOT NULL DEFAULT 'down',
  weapon text NOT NULL DEFAULT 'snowball',
  attacks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.player_saves TO service_role;
ALTER TABLE public.player_saves ENABLE ROW LEVEL SECURITY;