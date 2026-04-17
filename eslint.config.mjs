import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// ─────────────────────────────────────────────────────────────────────
// Design-system enforcement
//
// Goals:
//   1. Force every color/radius/font literal through `lib/theme/tokens.ts`.
//   2. Steer component authors toward `components/shared/*` wrappers
//      instead of raw MUI primitives that drift visually.
//   3. Prevent sub-14px text from sneaking back in via inline `fontSize`.
//
// Rules are warnings (not errors) to start — they still block commits
// via the pre-commit hook but don't explode the dev server. Flip to
// "error" once the backlog of existing violations is cleared.
// ─────────────────────────────────────────────────────────────────────

const designSystemRules = {
  // Colors + radii must resolve through tokens.
  // Matches hex literals in JSX string attributes + sx object values.
  "no-restricted-syntax": [
    "warn",
    {
      // Catches `color: '#DE3F5E'`, `bgcolor: "#1a1a1a"`, etc.
      selector:
        "Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]:not(ImportDeclaration Literal):not(ExportDeclaration Literal)",
      message:
        "Hex color literals must come from lib/theme/tokens.ts (COLORS.*). Never inline #DE3F5E, #1a1a1a, etc. If this is a genuinely unique value, add it to tokens first.",
    },
    {
      // Catches `fontFamily: 'Outfit'`, `'Instrument Serif'`, `'monospace'`, etc.
      selector:
        "Property[key.name='fontFamily'] > Literal:not([value=/^var\\(--font/])",
      message:
        "fontFamily must reference FONTS.body or FONTS.display from lib/theme/tokens.ts. Do not hand-write font names.",
    },
    {
      // Catches inline fontSize numeric values < 14.
      selector:
        "Property[key.name='fontSize'] > Literal[value=/^([0-9]|1[0-3])$/]",
      message:
        "Inline fontSize below 14px is banned — 14px (0.875rem) is the minimum. Use a Typography variant or bump the value.",
    },
    {
      // Catches inline fontSize rem/px literals below 14px.
      selector:
        "Property[key.name='fontSize'] > Literal[value=/^(0\\.[0-7]\\d*rem|1[0-3]px)$/]",
      message:
        "Inline fontSize below 14px (0.875rem) is banned. Use a Typography variant or bump the value.",
    },
  ],

  // Raw MUI primitives that have a shared wrapper should go through the
  // wrapper instead. Callers can still import the underlying MUI
  // component from inside `components/shared/*`.
  "no-restricted-imports": [
    "warn",
    {
      paths: [
        {
          name: "@mui/material",
          importNames: ["Alert"],
          message:
            "Use InfoAlert / SuccessAlert / WarningAlert / ErrorAlert from components/shared/Alert instead of raw MUI Alert.",
        },
        {
          name: "@mui/material",
          importNames: ["Menu"],
          message:
            "Use PheraMenu from components/shared/Menu instead of raw MUI Menu.",
        },
        {
          name: "@mui/material/Alert",
          message:
            "Use InfoAlert / SuccessAlert / WarningAlert / ErrorAlert from components/shared/Alert.",
        },
        {
          name: "@mui/material/Menu",
          message: "Use PheraMenu from components/shared/Menu.",
        },
      ],
    },
  ],
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Apply design-system rules to app + components sources.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: designSystemRules,
  },

  // Exempt files that legitimately own the tokens themselves, the
  // shared wrappers (which DO import from @mui/material by design),
  // and lib/theme which defines the palette.
  {
    files: [
      "components/shared/Alert.tsx",
      "components/shared/Menu.tsx",
      "components/shared/TextField.tsx",
      "components/shared/Card.tsx",
      "components/shared/Chip.tsx",
      "components/shared/Dialog.tsx",
      "components/shared/PageHeading.tsx",
      "components/shared/StatCard.tsx",
      "components/shared/EmptyState.tsx",
      "components/admin/ActionButton.tsx",
      "lib/theme/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": "off",
      "no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
