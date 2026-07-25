#!/bin/sh
# stamp-css.sh — pin every doc shell's stylesheet link to the CURRENT doc.css
# content hash, so a style change is visible on the next page load instead of
# hiding behind GitHub Pages' 10-minute cache (the "I don't see the change" bug,
# 2026-07-25). Idempotent: re-running with an unchanged doc.css rewrites nothing.
#
# Run manually after editing doc.css, or let .git/hooks/pre-commit call it.
cd "$(dirname "$0")" || exit 1
for asset in doc.css doc.js; do
  V=$(git hash-object "$asset" | cut -c1-10)
  A=$(printf '%s' "$asset" | sed 's/\./\\./g')
  CHANGED=0
  for f in *.html; do
    grep -q "$A" "$f" || continue
    if ! grep -q "$asset?v=$V" "$f"; then
      perl -pi -e "s/$A(\\?v=[^\"']*)?/$asset?v=$V/g" "$f"
      CHANGED=$((CHANGED+1))
    fi
  done
  echo "$asset?v=$V — stamped $CHANGED shell(s)"
done
