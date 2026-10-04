-- OAuth identities are authentication methods, not profile authorities.
-- The initial auth.users trigger already seeds a new profile from provider
-- metadata. Reconnecting a linked identity must never overwrite later edits.
drop trigger if exists sync_discord_identity_profile on auth.identities;
drop function if exists public.sync_discord_identity_profile();
