-- site_copy_edits — where "Lock this down" actually lands.
--
-- Before this table, an in-place edit on mike-wolf.com went to
-- netlify/functions/feedback.js, which (a) forwarded only a 200-char prose
-- summary and threw away key/oldHTML/newHTML, (b) proxied to soma-infer on the
-- VPS, and (c) returned {ok:true} even when the VPS was unreachable — which it
-- was. So the button reported "Filed 1 edit to ship" and the edit went nowhere.
--
-- This store is deliberately independent of the VPS. It holds the full diff, so
-- an edit is appliable to source without the human re-typing anything.
--
-- Applied to project omfwcodoimjmbrhssvfl on 2026-07-27.

create table if not exists public.site_copy_edits (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  site_id      text not null,                    -- e.g. 'mike-wolf-com/agi'
  page         text,                             -- full URL the edit was made on
  el_key       text not null,                    -- data-soma-editable value, or computed DOM path
  hint         text,                             -- human locator: tag + first words
  old_html     text,
  new_html     text,
  source       text not null default 'soma-edit',
  status       text not null default 'pending',  -- pending | applied | rejected
  applied_at   timestamptz,
  applied_note text
);

create index if not exists site_copy_edits_pending_idx
  on public.site_copy_edits (status, created_at desc);

alter table public.site_copy_edits enable row level security;

-- Write-only from the public internet. anon may INSERT a bounded row and can
-- never SELECT, UPDATE or DELETE — there is no policy for those, so a leaked
-- anon key (it is already public in agi/index.html by design) buys an attacker
-- nothing but junk rows in a table only the fleet reads. Reads and status
-- updates go through the Management API with Mike's account token.
drop policy if exists "anon files a copy edit" on public.site_copy_edits;
create policy "anon files a copy edit"
  on public.site_copy_edits
  for insert
  to anon
  with check (
    length(site_id) <= 120
    and length(el_key) <= 500
    and length(coalesce(hint, '')) <= 300
    and length(coalesce(old_html, '')) <= 20000
    and length(coalesce(new_html, '')) <= 20000
    and status = 'pending'
  );
