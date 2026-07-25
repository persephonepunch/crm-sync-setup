#!/bin/sh
# stamp-css.sh — pin every doc shell's stylesheet link to the CURRENT doc.css
# content hash, so a style change is visible on the next page load instead of
# hiding behind GitHub Pages' 10-minute cache (the "I don't see the change" bug,
# 2026-07-25). Idempotent: re-running with an unchanged doc.css rewrites nothing.
#
# Run manually after editing doc.css, or let .git/hooks/pre-commit call it.
cd "$(dirname "$0")" || exit 1
V=$(git hash-object doc.css | cut -c1-10)
CHANGED=0
for f in *.html; do
  grep -q "doc\.css" "$f" || continue
  if ! grep -q "doc\.css?v=$V" "$f"; then
    perl -pi -e "s/doc\\.css(\\?v=[^\"']*)?/doc.css?v=$V/g" "$f"
    CHANGED=$((CHANGED+1))
  fi
done
echo "doc.css?v=$V — stamped $CHANGED shell(s)"
