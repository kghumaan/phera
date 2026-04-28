#!/bin/bash
cd /Users/kvghumaan/Desktop/Code/phera
for p in features pricing about contact demo; do
  echo "=== app/$p/page.tsx ==="
  grep -nE "Suspense|useSearchParams|useRouter|useAuth\(\)|isMounted|hasMounted" "app/$p/page.tsx" | head -15
  echo ""
done
