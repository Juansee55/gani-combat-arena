ALTER TABLE public.profiles ADD COLUMN equipped_weapon text NOT NULL DEFAULT 'snowball', ADD COLUMN show_gang_tag boolean NOT NULL DEFAULT true;
CREATE TABLE public.inventory_items (user_id uuid NOT NULL, item_key text NOT NULL, quantity integer NOT NULL DEFAULT 1, PRIMARY KEY(user_id,item_key));
GRANT SELECT ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own inventory" ON public.inventory_items FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.gangs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, tag text NOT NULL UNIQUE, owner_id uuid NOT NULL);
GRANT SELECT, INSERT ON public.gangs TO authenticated;
GRANT ALL ON public.gangs TO service_role;
ALTER TABLE public.gangs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accounts read gangs" ON public.gangs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Accounts create gangs" ON public.gangs FOR INSERT TO authenticated WITH CHECK (owner_id=auth.uid());
CREATE TABLE public.gang_members (user_id uuid PRIMARY KEY, gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE);
GRANT SELECT, INSERT, DELETE ON public.gang_members TO authenticated;
GRANT ALL ON public.gang_members TO service_role;
ALTER TABLE public.gang_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own membership" ON public.gang_members FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Join as yourself" ON public.gang_members FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Leave own gang" ON public.gang_members FOR DELETE TO authenticated USING (user_id=auth.uid());
CREATE FUNCTION public.gang_add_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.gang_members(user_id,gang_id) VALUES(NEW.owner_id,NEW.id); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.gang_add_owner() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER gang_add_owner AFTER INSERT ON public.gangs FOR EACH ROW EXECUTE FUNCTION public.gang_add_owner();
CREATE FUNCTION public.profile_initial_inventory() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.inventory_items(user_id,item_key) VALUES(NEW.id,'snowball'),(NEW.id,'blades'),(NEW.id,'spear') ON CONFLICT DO NOTHING; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.profile_initial_inventory() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER profile_initial_inventory AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profile_initial_inventory();
INSERT INTO public.inventory_items(user_id,item_key) SELECT p.id, w.item_key FROM public.profiles p CROSS JOIN (VALUES('snowball'),('blades'),('spear')) w(item_key) ON CONFLICT DO NOTHING;