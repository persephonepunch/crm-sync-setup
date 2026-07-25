#!/bin/sh
# make-pdf.sh [slug ...] — regenerate the PDF edition of doc shells that declare
# data-pdf. Renders from the LOCAL working tree via a throwaway localhost server
# (never from live Pages, which lags the commit being made), with headless Chrome.
# No args: every shell carrying data-pdf. Called by .git/hooks/pre-commit.
cd "$(dirname "$0")" || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "make-pdf: Chrome not found — skipping PDF regeneration"; exit 0; }
PORT=8471
python3 -m http.server $PORT >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
slugs="$*"
if [ -z "$slugs" ]; then
  slugs=$(grep -l 'data-pdf=' ./*.html 2>/dev/null | sed 's/^\.\///; s/\.html$//')
fi
for s in $slugs; do
  [ -f "$s.html" ] || continue
  grep -q 'data-pdf=' "$s.html" || continue
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=20000 \
    --print-to-pdf="$s.pdf" "http://localhost:$PORT/$s.html" 2>/dev/null
  [ -s "$s.pdf" ] && echo "rendered $s.pdf ($(du -h "$s.pdf" | cut -f1))" || echo "FAILED: $s.pdf"
done
