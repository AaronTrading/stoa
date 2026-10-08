-- Keep profile billing keys immutable to members while allowing the signed
-- Stripe synchronizer to mirror the customer ID it has already recorded.
create or replace function public.protect_profile_system_fields()
returns trigger language plpgsql set search_path='' as $$
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')='service_role'
    or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile system fields are immutable';
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id
    and not exists (
      select 1
      from public.billing_customers billing
      where billing.user_id=old.id
        and billing.stripe_customer_id=new.stripe_customer_id
    ) then
    raise exception 'Profile system fields are immutable';
  end if;

  return new;
end; $$;
