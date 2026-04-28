#!/bin/bash
while true; do
  if curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://www.phera.io/ 2>/dev/null | grep -q 'og:image" content="https://www.phera.io'; then
    echo "DEPLOYED"
    date
    exit 0
  fi
  sleep 20
done
