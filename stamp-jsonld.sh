#!/bin/sh
# stamp-jsonld.sh — regenerate every doc shell's schema.org JSON-LD block FROM
# that doc's YAML frontmatter, so the markdown is the single source and the
# structured data cannot drift away from it.
#
# Why this exists: OG tags are a social-unfurl contract, but answer engines read
# visible prose, headings and JSON-LD. Hand-maintaining the JSON-LD in the shell
# creates a second copy of title/description/date that silently disagrees with
# the frontmatter the moment either is edited.
#
# Reads:  title, description, canonical, category, date, source, licence, and the
#         optional `alternativeHeadline:`, `keywords:`, `about:`, `citation:` fields.
# Writes: one <script type="application/ld+json"> block immediately before the
#         stylesheet link. Idempotent — unchanged frontmatter rewrites nothing.
#
# Run manually, or let .git/hooks/pre-commit call it when a .md is staged.
cd "$(dirname "$0")" || exit 1
python3 - "$@" <<'PY'
import json, os, re, sys, glob

def frontmatter(path):
    txt = open(path, encoding="utf-8").read()
    if not txt.startswith("---"):
        return None
    fm = txt.split("---")[1]
    out, key = {}, None
    for line in fm.splitlines():
        m = re.match(r'^([A-Za-z_-]+):\s*(.*)$', line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if val:
                out[key] = val.strip('"').strip("'")
                key = None
            else:
                out[key] = []
                nest = key
        elif key and re.match(r'^\s+-\s+', line):
            item = re.sub(r'^\s+-\s+', '', line).strip()
            sub = re.match(r'^(name|url):\s*(.*)$', item)
            if sub:                                   # list of maps, e.g. citation:
                out[key].append({sub.group(1): sub.group(2).strip().strip('"')})
            else:
                out[key].append(item.strip('"'))
        elif key and isinstance(out.get(key), list) and not out[key] and re.match(r'^\s+\w+:\s*\S', line):
            kv = re.match(r'^\s+(\w+):\s*(.*)$', line)
            if kv:
                if not isinstance(out[key], dict): out[key] = {}
                out[key][kv.group(1)] = kv.group(2).strip().strip('"')
        elif key and isinstance(out.get(key), dict) and re.match(r'^\s+\w+:\s*\S', line):
            kv = re.match(r'^\s+(\w+):\s*(.*)$', line)
            if kv: out[key][kv.group(1)] = kv.group(2).strip().strip('"')
        elif key and isinstance(out.get(key), list) and out[key] and isinstance(out[key][-1], dict):
            sub = re.match(r'^\s+(name|url):\s*(.*)$', line)
            if sub:
                out[key][-1][sub.group(1)] = sub.group(2).strip().strip('"')
    return out

only = set(a.replace(".html", "").replace(".md", "").lower() for a in sys.argv[1:])
changed, skipped = [], []

for shell in sorted(glob.glob("*.html")):
    slug = shell[:-5]
    if only and slug.lower() not in only:
        continue
    s = open(shell, encoding="utf-8").read()
    m = re.search(r'data-md="\./([^"]+)"', s)
    if not m:
        continue
    md = m.group(1)
    if not os.path.exists(md):
        skipped.append((slug, "md missing")); continue
    fm = frontmatter(md)
    if not fm or not fm.get("title"):
        skipped.append((slug, "no frontmatter")); continue

    base = fm.get("canonical") or f"https://persephonepunch.github.io/crm-sync-setup/{slug}.html"
    ld = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": base + "#article",
        "headline": fm["title"],
        "description": fm.get("description", ""),
        "datePublished": fm.get("date", ""),
        "dateModified": fm.get("date", ""),
        "author": {"@type": "Organization", "name": "CRM Sync", "url": "https://crm-sync.dev"},
        "publisher": {"@type": "Organization", "name": "CRM Sync", "url": "https://crm-sync.dev"},
        "mainEntityOfPage": base,
        "inLanguage": "en",
    }
    if fm.get("source"):   ld["isBasedOn"] = fm["source"]
    if fm.get("category"): ld["articleSection"] = fm["category"]
    if fm.get("licence") == "CC-BY-4.0":
        ld["license"] = "https://creativecommons.org/licenses/by/4.0/"
    # og:image doubles as the article image when the shell declares one
    og = re.search(r'og:image" content="([^"]*)"', s)
    if og and og.group(1):
        ld["image"] = og.group(1)
    # keywords / about are authored per doc; absent is better than invented
    if fm.get("alternativeHeadline"): ld["alternativeHeadline"] = fm["alternativeHeadline"]
    if fm.get("citation"):
        cits = [c for c in fm["citation"] if isinstance(c, dict) and c.get("url")]
        if cits:
            ld["citation"] = [{"@type": "WebPage", "name": c.get("name", ""), "url": c["url"]} for c in cits]
    if isinstance(fm.get("video"), dict) and fm["video"].get("embedUrl"):
        ld["video"] = dict({"@type": "VideoObject"}, **fm["video"])
    if fm.get("keywords"): ld["keywords"] = fm["keywords"]
    if fm.get("about"):
        ld["about"] = [{"@type": "Thing", "name": n} for n in fm["about"]]

    block = '<script type="application/ld+json">' + json.dumps(ld, separators=(",", ":"), ensure_ascii=False) + "</script>"
    existing = re.search(r'<script type="application/ld\+json">.*?</script>', s, re.S)
    if existing:
        if existing.group(0) == block:
            continue                      # unchanged — rewrite nothing
        new = s[:existing.start()] + block + s[existing.end():]
    else:
        anchor = re.search(r'<link rel="stylesheet" href="\./doc\.css', s)
        if not anchor:
            skipped.append((slug, "no stylesheet anchor")); continue
        new = s[:anchor.start()] + block + "\n" + s[anchor.start():]
    open(shell, "w", encoding="utf-8").write(new)
    changed.append(slug)

for c in changed: print(f"  stamped {c}")
for s_, why in skipped: print(f"  -- {s_}: {why}")
print(f"{len(changed)} stamped, {len(skipped)} skipped")
PY
