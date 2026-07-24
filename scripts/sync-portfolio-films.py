#!/opt/homebrew/bin/python3
"""
Sync Screening Room films marked public into mike-wolf-com's portfolio feed.

Stdlib-only. Reads ~/Projects/_estate/public-films.json, parses film metadata
from ~/Projects/_estate/SCREENING-ROOM.md, copies public film assets from
~/Projects/demo-producer/out/ into videos/portfolio/, and writes
portfolio-films.json only when at least one film is marked public.
"""
from __future__ import annotations

import json
import os
import re
import shutil
from pathlib import Path


PROJECTS_ROOT = Path(os.path.expanduser("~/Projects"))
ESTATE_DIR = PROJECTS_ROOT / "_estate"
PUBLIC_FILMS_PATH = ESTATE_DIR / "public-films.json"
SCREENING_ROOM_PATH = ESTATE_DIR / "SCREENING-ROOM.md"
SOURCE_VIDEO_DIR = PROJECTS_ROOT / "demo-producer" / "out"
SITE_ROOT = PROJECTS_ROOT / "mike-wolf-com"
DEST_VIDEO_DIR = SITE_ROOT / "videos" / "portfolio"
PORTFOLIO_FEED_PATH = SITE_ROOT / "portfolio-films.json"
RAW_PREFIX = "/raw/screening-room-videos/"


def load_public_testids() -> set[str]:
    if not PUBLIC_FILMS_PATH.exists():
        return set()
    with PUBLIC_FILMS_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{PUBLIC_FILMS_PATH} must contain a JSON object")
    return {str(testid) for testid, is_public in data.items() if is_public is True}


def parse_duration(line: str) -> str:
    match = re.search(r"\*\*Duration:\*\*\s*([^·\n]+)", line)
    return match.group(1).strip() if match else ""


def normalize_title(title: str) -> str:
    return title.replace('"', "").strip()


def parse_screening_room() -> dict[str, dict[str, str]]:
    text = SCREENING_ROOM_PATH.read_text(encoding="utf-8")
    lines = text.splitlines()
    films: dict[str, dict[str, str]] = {}
    current_property = ""
    current_title = ""
    current_duration = ""
    pending_blurb_lines: list[str] = []
    blurb_for_current = ""
    in_film = False
    film_json_lines: list[str] = []

    for line in lines + [""]:
        if in_film:
            if line.strip().startswith("```"):
                raw_json = "\n".join(film_json_lines)
                payload = json.loads(raw_json)
                testid = payload.get("testid")
                if testid:
                    films[testid] = {
                        "title": normalize_title(current_title),
                        "blurb": blurb_for_current.strip(),
                        "property": current_property.strip(),
                        "duration": current_duration.strip(),
                        "src": payload.get("src", ""),
                        "poster": payload.get("poster", ""),
                        "vtt": payload.get("vtt", ""),
                    }
                in_film = False
                film_json_lines = []
                continue
            film_json_lines.append(line)
            continue

        stripped = line.strip()
        if stripped == "```film":
            if pending_blurb_lines and not blurb_for_current:
                blurb_for_current = " ".join(pending_blurb_lines)
            pending_blurb_lines = []
            in_film = True
            film_json_lines = []
            continue
        if stripped.startswith("## ") and not stripped.startswith("### "):
            current_property = stripped[3:].strip()
            continue
        if stripped.startswith("### "):
            current_title = stripped[4:].strip()
            current_duration = ""
            pending_blurb_lines = []
            blurb_for_current = ""
            continue
        if stripped.startswith("**Duration:**"):
            current_duration = parse_duration(stripped)
            pending_blurb_lines = []
            blurb_for_current = ""
            continue
        if current_title and stripped and not stripped.startswith("```"):
            if not blurb_for_current:
                pending_blurb_lines.append(stripped)
            continue
        if current_title and not stripped and pending_blurb_lines and not blurb_for_current:
            blurb_for_current = " ".join(pending_blurb_lines)
            pending_blurb_lines = []

    return films


def source_path_from_raw(raw_path: str) -> Path | None:
    if not raw_path:
        return None
    if not raw_path.startswith(RAW_PREFIX):
        raise ValueError(f"Unsupported film asset path: {raw_path}")
    filename = raw_path[len(RAW_PREFIX):]
    if "/" in filename or not filename:
        raise ValueError(f"Unexpected film asset filename: {raw_path}")
    return SOURCE_VIDEO_DIR / filename


def copy_asset(raw_path: str) -> str:
    source = source_path_from_raw(raw_path)
    if source is None:
        return ""
    if not source.is_file():
        raise FileNotFoundError(source)
    DEST_VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    dest = DEST_VIDEO_DIR / source.name
    shutil.copy2(source, dest)
    return f"videos/portfolio/{source.name}"


def build_entry(film: dict[str, str]) -> dict[str, str]:
    entry = {
        "title": film["title"],
        "blurb": film["blurb"],
        "property": film["property"],
        "duration": film["duration"],
        "video": copy_asset(film["src"]),
        "poster": copy_asset(film["poster"]),
    }
    if film.get("vtt"):
        entry["vtt"] = copy_asset(film["vtt"])
    return entry


def main() -> int:
    public_testids = load_public_testids()
    if not public_testids:
        print("No public films marked; leaving portfolio-films.json unchanged.")
        return 0

    films_by_testid = parse_screening_room()
    missing = sorted(public_testids - set(films_by_testid))
    if missing:
        raise SystemExit(f"Public testid(s) not found in SCREENING-ROOM.md: {', '.join(missing)}")

    entries = [build_entry(films_by_testid[testid]) for testid in sorted(public_testids)]
    with PORTFOLIO_FEED_PATH.open("w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
        f.write("\n")

    copied_assets = sum(2 + (1 if entry.get("vtt") else 0) for entry in entries)
    print(f"Wrote {PORTFOLIO_FEED_PATH} with {len(entries)} public film(s).")
    print(f"Copied {copied_assets} asset(s) into {DEST_VIDEO_DIR}.")
    for entry in entries:
        print(f"- {entry['property']}: {entry['title']} ({entry['duration']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
