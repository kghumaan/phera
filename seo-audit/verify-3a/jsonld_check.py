#!/usr/bin/env python3
import re, json, os, sys
ROUTES = [
    ("home", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/home.html"),
    ("about", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/about.html"),
    ("features", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/features.html"),
    ("pricing", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/pricing.html"),
    ("contact", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/contact.html"),
    ("blog-index", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/blog-index.html"),
    ("blog-post", "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/blog-post.html"),
]
ALL_OK = True
for name, path in ROUTES:
    if not os.path.exists(path):
        print(f"=== {name} === MISSING FILE")
        ALL_OK = False
        continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()
    blocks = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, flags=re.DOTALL)
    print(f"=== {name} === blocks: {len(blocks)}")
    types = []
    for i, raw in enumerate(blocks):
        try:
            data = json.loads(raw.strip())
        except Exception as e:
            print(f"  block {i+1}: PARSE_ERROR {e}")
            ALL_OK = False
            continue
        if isinstance(data, dict):
            t = data.get("@type", "?")
            types.append(t)
            extra = ""
            if t == "SoftwareApplication":
                offers = data.get("offers", [])
                prices = [o.get("price") for o in offers] if isinstance(offers, list) else []
                extra = f" prices={prices}"
            if t == "FAQPage":
                me = data.get("mainEntity", [])
                extra = f" questions={len(me) if isinstance(me, list) else '?'}"
            if t == "BlogPosting":
                extra = f" headline='{data.get('headline','')[:50]}'"
            if t == "Organization":
                extra = f" name='{data.get('name')}' url='{data.get('url')}'"
            print(f"  block {i+1}: {t}{extra} VALID")
        elif isinstance(data, list):
            for j, d in enumerate(data):
                if isinstance(d, dict):
                    types.append(d.get("@type", "?"))
                    print(f"  block {i+1}[{j}]: {d.get('@type','?')} VALID")
                else:
                    print(f"  block {i+1}[{j}]: NON_DICT {type(d).__name__}")
        else:
            print(f"  block {i+1}: NON_OBJECT {type(data).__name__}")
    org_count = types.count("Organization")
    if org_count == 0:
        print(f"  ❌ MISSING Organization")
        ALL_OK = False
    elif org_count > 1:
        print(f"  ❌ DUPLICATE Organization x{org_count}")
        ALL_OK = False
    else:
        print(f"  ✅ Organization count = 1")
    print()
sys.exit(0 if ALL_OK else 1)
