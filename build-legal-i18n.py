#!/usr/bin/env python3
"""Generate multilingual legal pages (Terms + Privacy) from per-language content
fragments in i18n/, sharing one <style> shell. The language pill bar becomes LINKS
between pages (English = /terms.html, French = /terms-fr.html, ...). Run:
    python3 build-legal-i18n.py
Outputs, per doc and language: <doc>[-<suffix>].html (full page, GitHub Pages)
and <doc>[-<suffix>]-embed.html (Webflow Embed; links point at the absolute Pages
URLs so the bar works from the Webflow domain too)."""
import re, os, html

BASE_URL = "https://persephonepunch.github.io/crm-sync-setup"
# (lang code, label, url-suffix)  — '' suffix = the canonical English page
LANGS = [
    ("en",      "English",     ""),
    ("fr",      "Français",    "-fr"),
    ("ko",      "한국어",       "-ko"),
    ("zh-Hans", "中文(简体)",   "-zh-hans"),
    ("zh-Hant", "中文(繁體)",   "-zh-hant"),
    ("ja",      "日本語",       "-ja"),
]
DOCS = ["terms", "privacy"]
I18N = "i18n"

def style_block():
    h = open("terms.html", encoding="utf-8").read()
    return re.search(r"<style>.*?</style>", h, re.S).group(0)

def lang_bar(doc, active, embed):
    out = ['<div class="lang-bar" aria-label="Language">']
    for code, label, suf in LANGS:
        if code == active:
            out.append(f'    <span class="lang-tab active">{label}</span>')
        else:
            href = (f"{BASE_URL}/{doc}{suf}.html" if embed else f"{doc}{suf}.html")
            out.append(f'    <a class="lang-tab" href="{href}">{label}</a>')
    out.append("  </div>")
    return "\n    ".join(out)

def build():
    style = style_block()
    for doc in DOCS:
        for code, label, suf in LANGS:
            frag_path = os.path.join(I18N, f"{doc}.{code}.html")
            if not os.path.exists(frag_path):
                continue  # not translated yet — skip
            content = open(frag_path, encoding="utf-8").read()
            for embed in (False, True):
                bar = lang_bar(doc, code, embed)
                inner = content.replace("{{LANGBAR}}", bar)
                if embed:
                    page = (f"<!-- {doc.title()} ({label}) — paste into a Webflow Embed -->\n"
                            f"{style}\n\n<div class=\"container\">\n{inner}\n</div>\n")
                    out = f"{doc}{suf}-embed.html"
                else:
                    page = ("<!DOCTYPE html>\n<html lang=\"" + code + "\">\n<head>\n"
                            "<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n"
                            f"<title>{'Terms of Service' if doc=='terms' else 'Privacy Policy'} — CRM Sync</title>\n"
                            f"{style}\n</head>\n<body>\n\n<div class=\"container\">\n{inner}\n</div>\n\n</body>\n</html>\n")
                    out = f"{doc}{suf}.html"
                open(out, "w", encoding="utf-8").write(page)
                print("wrote", out, f"({len(page)} chars)")

if __name__ == "__main__":
    build()
