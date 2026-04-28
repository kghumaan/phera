#!/bin/bash
cd /Users/kvghumaan/Desktop/Code/phera/seo-audit/verify-3a
declare -A ROUTES=(
  [home]="/"
  [about]="/about"
  [features]="/features"
  [pricing]="/pricing"
  [contact]="/contact"
  [blog-index]="/blog"
  [blog-post]="/blog/indian-wedding-task-management"
)
for name in home about features pricing contact blog-index blog-post; do
  case $name in
    home) p="/";; about) p="/about";; features) p="/features";;
    pricing) p="/pricing";; contact) p="/contact";; blog-index) p="/blog";;
    blog-post) p="/blog/indian-wedding-task-management";;
  esac
  curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "https://www.phera.io${p}" -o "${name}.html" -w "${name}: %{http_code} %{size_download}b path=${p}\n"
done
