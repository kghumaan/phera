#!/bin/bash
cd /Users/kvghumaan/Desktop/Code/phera
FILES=("app/page.tsx" "app/about/page.tsx" "app/features/page.tsx" "app/pricing/page.tsx" "app/contact/page.tsx" "app/blog/page.tsx" "app/blog/[slug]/page.tsx" "app/demo/page.tsx" "app/privacy/page.tsx" "app/terms/page.tsx" "app/layout.tsx" "app/not-found.tsx")
for f in "${FILES[@]}"; do
  echo "=== $f ==="
  if [ -f "$f" ]; then
    echo "  first_line: $(head -1 "$f")"
    echo "  use_client: $(grep -c '"use client"' "$f")"
    echo "  metadata_const: $(grep -cE 'export const metadata' "$f")"
    echo "  generateMetadata: $(grep -cE 'generateMetadata' "$f")"
  else
    echo "  MISSING"
  fi
done
