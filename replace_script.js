const fs = require('fs');

function replaceWithComponents(file) {
  let data = fs.readFileSync(file, 'utf8');
  
  // Add imports
  if (!data.includes('import AppFooter')) {
    data = data.replace(
      /import AppHeader from '[@\/]components\/shared\/AppHeader';/,
      "import AppHeader from '@/components/shared/AppHeader';\nimport AppFooter from '@/components/shared/AppFooter';\nimport FinalCTA from '@/components/shared/FinalCTA';"
    );
  }

  // Replace Final CTA and Footer
  data = data.replace(
    /\{\/\* --- FINAL CTA --- \*\/\}[\s\S]*?\{\/\* --- FOOTER --- \*\/\}/,
    '{/* --- FINAL CTA --- */}\n        <FinalCTA />\n\n        {/* --- FOOTER --- */}'
  );

  data = data.replace(
    /\{\/\* --- FOOTER --- \*\/\}[\s\S]*?(?:<\/Box>\s*){2}(?:<LoginModal)/,
    '{/* --- FOOTER --- */}\n        <AppFooter />\n      </Box>\n\n      <LoginModal'
  );

  fs.writeFileSync(file, data);
  console.log('Replaced in ' + file);
}

replaceWithComponents('app/page.tsx');
// for pricing and features they only have parts of the code left, let's check what's inside them first.
