#!/usr/bin/env python3
import re
import os
import json
from html.parser import HTMLParser

ROUTES = ["home", "about", "features", "pricing", "contact", "blog-indian-wedding-task-management"]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "svg", "template"):
            self.skip += 1
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg", "template"):
            self.skip = max(0, self.skip - 1)
    def handle_data(self, data):
        if self.skip == 0:
            t = data.strip()
            if t:
                self.text.append(t)

def extract_tags(html, tag):
    return re.findall(rf'<{tag}[^>]*>(.*?)</{tag}>', html, flags=re.DOTALL | re.IGNORECASE)

def strip_inner_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()

def looks_csr(html):
    # Find body content. If body contains very little non-script content but has a __next or react root, it's CSR.
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, flags=re.DOTALL | re.IGNORECASE)
    if not body_match:
        return None
    body = body_match.group(1)
    # Strip scripts
    no_script = re.sub(r'<script[\s\S]*?</script>', '', body, flags=re.IGNORECASE)
    no_style = re.sub(r'<style[\s\S]*?</style>', '', no_script, flags=re.IGNORECASE)
    no_tags = re.sub(r'<[^>]+>', ' ', no_style)
    text = re.sub(r'\s+', ' ', no_tags).strip()
    return len(text)

results = {}
for route in ROUTES:
    path = f"/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/{route}.html"
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    # H1, H2
    h1s = [strip_inner_tags(x) for x in extract_tags(html, "h1")]
    h2s = [strip_inner_tags(x) for x in extract_tags(html, "h2")]
    h1s = [x for x in h1s if x]
    h2s = [x for x in h2s if x]

    # Visible text in body (strip script/style)
    extractor = TextExtractor()
    extractor.feed(html)
    visible = " ".join(extractor.text)
    word_count = len(visible.split())

    # Body non-script char count (rough proxy for SSR)
    body_chars = looks_csr(html)

    # JSON-LD blocks
    jsonld_blocks = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, flags=re.DOTALL)
    jsonld_types = []
    for block in jsonld_blocks:
        try:
            data = json.loads(block.strip())
            if isinstance(data, dict):
                jsonld_types.append(data.get("@type", "?"))
            elif isinstance(data, list):
                for d in data:
                    if isinstance(d, dict):
                        jsonld_types.append(d.get("@type", "?"))
        except Exception as e:
            jsonld_types.append(f"PARSE_ERROR: {e}")

    # __next root
    next_root_empty = bool(re.search(r'<div id="__next">\s*</div>', html))

    results[route] = {
        "h1": h1s,
        "h2": h2s,
        "word_count": word_count,
        "body_text_chars": body_chars,
        "jsonld_blocks": len(jsonld_blocks),
        "jsonld_types": jsonld_types,
        "next_root_empty": next_root_empty,
        "visible_sample": visible[:300],
    }

for route, r in results.items():
    print(f"\n========== {route} ==========")
    print(f"  H1 ({len(r['h1'])}): {r['h1']}")
    print(f"  H2 ({len(r['h2'])}): {r['h2'][:10]}{' ...' if len(r['h2'])>10 else ''}")
    print(f"  Word count (visible): {r['word_count']}")
    print(f"  Body non-script chars: {r['body_text_chars']}")
    print(f"  JSON-LD blocks: {r['jsonld_blocks']} types={r['jsonld_types']}")
    print(f"  __next empty: {r['next_root_empty']}")
    print(f"  Sample: {r['visible_sample'][:200]}")
