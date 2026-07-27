#!/usr/bin/env python3
"""copy-edits — read the edits Mike filed with "Lock this down", so the fleet can
apply them to source without him copying anything out of a browser.

Reads public.site_copy_edits in the shared SOMA Auth project through the Supabase
Management API, using the account token stored in the macOS Keychain by
`supabase login`. Nothing here needs a project key: the table is write-only to
the publishable key on purpose (RLS grants INSERT and nothing else), so this is
the read side.

    scripts/copy-edits.py                 # pending edits, newest first
    scripts/copy-edits.py --all           # including applied/rejected
    scripts/copy-edits.py --diff          # old -> new, ready to apply
    scripts/copy-edits.py --apply <id>… [--note "…"]
    scripts/copy-edits.py --reject <id>… [--note "…"]

Marking applied is a separate step from applying, deliberately: the row should
flip once the change is actually in source and deployed, not when it was read.
"""

import argparse
import json
import subprocess
import sys
import urllib.request

PROJECT_REF = "omfwcodoimjmbrhssvfl"
API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
TABLE = "public.site_copy_edits"


def token() -> str:
    try:
        out = subprocess.run(
            ["security", "find-generic-password", "-s", "Supabase CLI", "-w"],
            capture_output=True, text=True, check=True,
        )
    except subprocess.CalledProcessError:
        sys.exit("No Supabase token in the Keychain. Run: supabase login")
    tok = out.stdout.strip()
    if not tok:
        sys.exit("Keychain item 'Supabase CLI' is empty. Run: supabase login")
    return tok


def sql(query: str):
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": query}).encode(),
        # Explicit UA: the API's edge returns 403 to the default Python-urllib one.
        headers={
            "Authorization": f"Bearer {token()}",
            "Content-Type": "application/json",
            "User-Agent": "mike-wolf-com-copy-edits/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read().decode() or "[]")
    if isinstance(body, dict) and "message" in body:
        sys.exit(f"Supabase error: {body['message']}")
    return body


def quote(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def uuids(vals):
    bad = [v for v in vals if len(v) != 36 or v.count("-") != 4]
    if bad:
        sys.exit(f"Not an edit id: {bad[0]}")
    return ", ".join(quote(v) for v in vals)


def show(rows, with_diff):
    if not rows:
        print("No edits.")
        return
    for r in rows:
        print(f"\n\033[1m{r['hint'] or r['el_key']}\033[0m")
        print(f"  id      {r['id']}   [{r['status']}]  {r['created_at'][:19].replace('T', ' ')}Z")
        print(f"  site    {r['site_id']}")
        print(f"  page    {r['page']}")
        print(f"  key     {r['el_key']}")
        if r.get("applied_note"):
            print(f"  note    {r['applied_note']}")
        if with_diff:
            print(f"  \033[31m- {r['old_html']}\033[0m")
            print(f"  \033[32m+ {r['new_html']}\033[0m")
    print(f"\n{len(rows)} edit(s).")


def main():
    p = argparse.ArgumentParser(description="Read and resolve in-place site copy edits.")
    p.add_argument("--all", action="store_true", help="include applied and rejected")
    p.add_argument("--diff", action="store_true", help="show old -> new")
    p.add_argument("--json", action="store_true", help="raw JSON out")
    p.add_argument("--apply", nargs="+", metavar="ID", help="mark edits applied")
    p.add_argument("--reject", nargs="+", metavar="ID", help="mark edits rejected")
    p.add_argument("--note", default=None, help="note to store with --apply/--reject")
    a = p.parse_args()

    if a.apply or a.reject:
        status = "applied" if a.apply else "rejected"
        ids = a.apply or a.reject
        note = f", applied_note = {quote(a.note)}" if a.note else ""
        rows = sql(
            f"update {TABLE} set status = {quote(status)}, applied_at = now(){note} "
            f"where id in ({uuids(ids)}) returning id, status, hint"
        )
        for r in rows:
            print(f"{r['status']:9} {r['id']}  {r['hint'] or ''}")
        if not rows:
            print("No rows matched — already resolved, or wrong id.")
        return

    where = "" if a.all else "where status = 'pending' "
    rows = sql(
        f"select id, created_at, site_id, page, el_key, hint, old_html, new_html, "
        f"status, applied_note from {TABLE} {where}order by created_at desc limit 200"
    )
    if a.json:
        print(json.dumps(rows, indent=2))
    else:
        show(rows, a.diff or not a.all)


if __name__ == "__main__":
    main()
