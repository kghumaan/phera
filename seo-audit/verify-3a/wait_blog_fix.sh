#!/bin/bash
while true; do
  body=$(curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://www.phera.io/blog/indian-wedding-task-management 2>/dev/null)
  if echo "$body" | grep -q '"datePublished":"2026-02-19T00:00:00.000Z"' && echo "$body" | grep -q '"image":"https://www.phera.io'; then
    echo DEPLOYED
    date
    exit 0
  fi
  sleep 20
done
