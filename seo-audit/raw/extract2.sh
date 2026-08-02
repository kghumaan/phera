#!/bin/bash
cd /Users/kvghumaan/Desktop/Code/phera/seo-audit/raw
for f in home about features pricing contact blog-indian-wedding-task-management; do
  echo "=== $f ==="
  echo -n "OG tags: "
  grep -oE 'property="og:[a-z:]+"' "$f.html" | sort -u | tr '\n' ' '
  echo ""
  echo -n "Twitter tags: "
  grep -oE 'name="twitter:[a-z:]+"' "$f.html" | sort -u | tr '\n' ' '
  echo ""
done
