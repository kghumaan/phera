#!/bin/bash
cd /Users/kvghumaan/Desktop/Code/phera/seo-audit/raw
for f in home about features pricing contact blog-indian-wedding-task-management; do
  echo "=========== $f ==========="
  echo "--- TITLE ---"
  grep -oE '<title[^>]*>[^<]*</title>' "$f.html" | head -3
  echo "--- META DESC ---"
  grep -oE '<meta name="description" content="[^"]*"' "$f.html" | head -1
  echo "--- OG title ---"
  grep -oE '<meta property="og:title" content="[^"]*"' "$f.html" | head -1
  echo "--- OG desc ---"
  grep -oE '<meta property="og:description" content="[^"]*"' "$f.html" | head -1
  echo "--- OG image ---"
  grep -oE '<meta property="og:image"[^>]*content="[^"]*"' "$f.html" | head -1
  echo "--- og count ---"
  grep -c 'property="og:' "$f.html"
  echo "--- twitter count ---"
  grep -c 'name="twitter:' "$f.html"
  echo "--- JSON-LD count ---"
  grep -c 'application/ld' "$f.html"
  echo "--- canonical ---"
  grep -oE '<link[^>]*rel="canonical"[^>]*>' "$f.html" | head -1
  echo ""
done
