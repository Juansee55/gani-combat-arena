CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT 'Jugador', avatar_url text NOT NULL DEFAULT '');
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.initialize_game_account() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles(id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
IF lower(NEW.email) = 'garayjuan832@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN
INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
END IF;
RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.initialize_game_account() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER initialize_game_account AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.initialize_game_account();
INSERT INTO public.profiles(id) SELECT id FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles(user_id, role) SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'garayjuan832@gmail.com' AND email_confirmed_at IS NOT NULL ON CONFLICT (user_id, role) DO NOTHING;