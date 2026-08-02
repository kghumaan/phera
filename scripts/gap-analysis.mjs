#!/usr/bin/env node
// Gap analysis: query vendor API for all city+category combos, print a table

const BASE = 'http://localhost:3002'

const CITIES = ['Goa','Udaipur','Jaipur','Jodhpur','Rishikesh','Kerala','Bangkok','Bali','Dubai']
const CATS = [
  'photographer','videographer','dj','live_band','mehendi_artist',
  'makeup_hair','decorator_florist','wedding_planner','catering','designer',
]

const CAT_LABELS = {
  photographer:'Photographer', videographer:'Videographer', dj:'DJ',
  live_band:'Live Band', mehendi_artist:'Mehendi', makeup_hair:'Makeup & Hair',
  decorator_florist:'Decorator', wedding_planner:'Planner', catering:'Catering', designer:'Designer',
}

async function getCount(city, category) {
  const url = `${BASE}/api/vendors/directory?city=${encodeURIComponent(city)}&category=${category}&limit=1`
  const r = await fetch(url)
  const j = await r.json()
  return j.total ?? 0
}

const results = []
let total = 0

for (const city of CITIES) {
  for (const cat of CATS) {
    const count = await getCount(city, cat)
    results.push({ city, cat, count })
    total += count
    process.stdout.write('.')
  }
}

console.log('\n\nGAP ANALYSIS (city × category counts)\n')

// Print header
const header = ['City', ...CATS.map(c => CAT_LABELS[c].slice(0,8).padEnd(8))].join(' | ')
console.log(header)
console.log('-'.repeat(header.length))

for (const city of CITIES) {
  const row = [city.padEnd(10)]
  for (const cat of CATS) {
    const { count } = results.find(r => r.city === city && r.cat === cat)
    row.push(String(count).padStart(8))
  }
  console.log(row.join(' | '))
}

const THRESHOLD = 3
const gaps = results.filter(r => r.count < THRESHOLD)
console.log(`\n\nGAPS (< ${THRESHOLD} vendors):`)
console.log(gaps.map(g => `  ${g.city} / ${CAT_LABELS[g.cat]}: ${g.count}`).join('\n'))
console.log(`\nTotal gaps: ${gaps.length} / 90 combinations`)
console.log(`Total vendor records: ${total} (counting duplicates across combos)`)

// JSON export for workflow
import { writeFileSync } from 'fs'
writeFileSync('/tmp/vendor-gaps.json', JSON.stringify(gaps, null, 2))
console.log('\nWrote gap list to /tmp/vendor-gaps.json')
