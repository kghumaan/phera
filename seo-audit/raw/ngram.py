#!/usr/bin/env python3
import re
import os
from html.parser import HTMLParser
from collections import Counter

ROUTES = ["home", "about", "features", "pricing", "contact", "blog-indian-wedding-task-management", "blog-index"]

STOP = set("""
a an the and or but if then so as of in on at to for from with by is are was were be been being have has had do does did
this that these those it its i you we they he she them us our your their my me him her his hers ours yours theirs not no nor
will would shall should may might must can could there here where when why how what which who whom whose
about into onto over under up down out off again further once before after above below between through during
just very really only also too more most less very few many much some any all such own same other another both each
i'm you're we're they're it's don't doesn't didn't won't wouldn't isn't aren't wasn't weren't haven't hasn't hadn't can't couldn't
'm 're 's 've 'll 'd 't
e.g i.e etc vs vs.
""".split())

KEYWORDS_FLAG = [
    "indian wedding",
    "wedding planning",
    "wedding coordination",
    "rsvp",
    "wedding website",
    "shaadi",
    "destination wedding",
    "wedding planner",
    "wedding management",
]

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

def tokenize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9'\s-]", " ", text)
    tokens = [t for t in re.split(r"\s+", text) if t and t not in STOP and not t.isdigit() and len(t) > 1]
    return tokens

def ngrams(tokens, n):
    return [" ".join(tokens[i:i+n]) for i in range(len(tokens)-n+1)]

print()
print("=" * 70)
print("KEYWORD FLAG MATRIX (visible-text occurrences per route)")
print("=" * 70)
header = ["route".ljust(45)] + [k[:14].ljust(15) for k in KEYWORDS_FLAG]
print(" | ".join(header))
print("-" * 200)

route_texts = {}
for route in ROUTES:
    path = f"/Users/kvghumaan/Desktop/Code/phera/seo-audit/raw/{route}.html"
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()
    extractor = TextExtractor()
    extractor.feed(html)
    visible = " ".join(extractor.text)
    route_texts[route] = visible
    counts = []
    lower = visible.lower()
    for kw in KEYWORDS_FLAG:
        c = lower.count(kw)
        counts.append(str(c).ljust(15))
    print(" | ".join([route.ljust(45)] + counts))

for route, visible in route_texts.items():
    tokens = tokenize(visible)
    print()
    print("=" * 70)
    print(f"ROUTE: {route}  (tokens={len(tokens)})")
    print("=" * 70)
    for n in (1, 2, 3):
        c = Counter(ngrams(tokens, n))
        # filter unigrams that are pure 1-char or numbers
        top = c.most_common(20)
        print(f"\nTop {n}-grams:")
        for term, cnt in top:
            print(f"  {cnt:3d}  {term}")
