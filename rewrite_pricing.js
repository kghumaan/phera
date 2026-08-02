const fs = require('fs');

const data = fs.readFileSync('app/page.tsx', 'utf8');

// The file has a structured layout, we can use regex or substring indexOf to extract and rebuild.

// Let's copy page.tsx and just replace the middle.
let pricingContent = data.replace(
  /\{\/\* --- HERO SECTION --- \*\/\}[\s\S]*?\{\/\* --- PRICING --- \*\/\}/,
  '{/* --- PRICING --- */}'
);

pricingContent = pricingContent.replace(
  /\{\/\* --- FAQ --- \*\/\}[\s\S]*?\{\/\* --- FOOTER --- \*\/\}/,
  '{/* --- FOOTER --- */}'
);

// Remove default export of LandingPage and add PricingPage
pricingContent = pricingContent.replace(
  /export default function LandingPage\(\) \{/,
  'export default function PricingPage() {'
);

// We need to fix the padding for pricing page so the header isn't covering it, actually the background sets pt
// Wait, in PRICING section, it says id="pricing" sx={{ bgcolor: '#F0F2F5', py: { xs: 3, md: 10 } }}
// Let's add a pt: 16 to the main box so it's not hidden behind nav.
pricingContent = pricingContent.replace(
  /<Box component="main" sx=\{\{ flexGrow: 1 \}\}>/,
  '<Box component="main" sx={{ flexGrow: 1, pt: 16 }}>'
);

fs.writeFileSync('app/pricing/page.tsx', pricingContent);
console.log('Pricing page written.');

let featuresContent = data.replace(
  /export default function LandingPage\(\) \{/,
  'export default function FeaturesPage() {'
);

// For features, we keep HERO? No, remove HERO, PLANNERS, WHATSAPP, ROADMAP, PRICING, FAQ, FINAL CTA
featuresContent = featuresContent.replace(
  /\{\/\* --- HERO SECTION --- \*\/\}[\s\S]*?\{\/\* --- FEATURES SECTION --- \*\/\}/,
  '{/* --- FEATURES SECTION --- */}'
);

featuresContent = featuresContent.replace(
  /\{\/\* --- FOR PLANNERS SECTION --- \*\/\}[\s\S]*?\{\/\* --- FOOTER --- \*\/\}/,
  '{/* --- FOOTER --- */}'
);

// Add top padding
featuresContent = featuresContent.replace(
  /<Box component="main" sx=\{\{ flexGrow: 1 \}\}>/,
  '<Box component="main" sx={{ flexGrow: 1, pt: 16 }}>'
);

fs.writeFileSync('app/features/page.tsx', featuresContent);
console.log('Features page written.');

