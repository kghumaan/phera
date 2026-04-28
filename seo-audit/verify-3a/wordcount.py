#!/usr/bin/env python3
import re, os
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script","style","noscript","svg","template"):
            self.skip += 1
    def handle_endtag(self, tag):
        if tag in ("script","style","noscript","svg","template"):
            self.skip = max(0, self.skip-1)
    def handle_data(self, data):
        if self.skip == 0:
            t = data.strip()
            if t: self.text.append(t)

routes = [
    ("home","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/home.html",
            "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/home.html"),
    ("about","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/about.html",
             "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/about.html"),
    ("features","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/features.html",
                "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/features.html"),
    ("pricing","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/pricing.html",
               "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/pricing.html"),
    ("contact","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/contact.html",
               "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/contact.html"),
    ("blog-index","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/blog-index.html",
                  "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/blog-index.html"),
    ("blog-post","/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/blog-indian-wedding-task-management.html",
                 "/Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a/blog-post.html"),
]

def count(path):
    if not os.path.exists(path): return None
    with open(path,"r",encoding="utf-8",errors="ignore") as f:
        html = f.read()
    e = TextExtractor()
    e.feed(html)
    visible = " ".join(e.text)
    return len(visible.split())

print(f"{'route':<14} {'step1':>8} {'now':>8} {'delta':>8}")
for name, baseline, now in routes:
    b = count(baseline)
    n = count(now)
    delta = (n - b) if (b is not None and n is not None) else "?"
    print(f"{name:<14} {b!s:>8} {n!s:>8} {delta!s:>8}")
