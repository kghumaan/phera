#!/bin/bash
cd /Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a
for f in home about features pricing contact blog-index blog-post; do
  echo "=== $f ==="
  echo -n "  canonical: "
  grep -oE '<link[^>]*rel="canonical"[^>]*>' "$f.html" | head -1
  echo ""
  echo -n "  og:url: "
  grep -oE '<meta property="og:url" content="[^"]*"' "$f.html" | head -1
  echo ""
  echo -n "  og:image: "
  grep -oE '<meta property="og:image" content="[^"]*"' "$f.html" | head -1
  echo ""
  echo -n "  twitter:image: "
  grep -oE '<meta name="twitter:image" content="[^"]*"' "$f.html" | head -1
  echo ""
done
