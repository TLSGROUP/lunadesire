-- Seed: promote nitrodev24@gmail.com to admin after they sign up via Supabase Auth.
-- Run this AFTER the user has registered through the app (the trigger creates the profile row).
--
-- Usage in Supabase SQL editor:
--   update public.profiles set role = 'admin' where email = 'nitrodev24@gmail.com';

update public.profiles
set role = 'admin'
where email = 'nitrodev24@gmail.com';
