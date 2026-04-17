'use client';

/**
 * Standard Phera dropdown menu.
 *
 * Always renders with white background, dark text, and token-backed
 * radius/shadow — never a dark surface. Use instead of raw MUI `<Menu>`
 * so every dropdown in the app looks identical.
 *
 * ```tsx
 * <PheraMenu anchorEl={anchor} open={open} onClose={close}>
 *   <PheraMenuItem onClick={...}>Export all</PheraMenuItem>
 * </PheraMenu>
 * ```
 *
 * Accepts every prop MUI's `Menu` accepts. `MenuListProps` / `PaperProps`
 * passed in are merged on top of the defaults so callers can tweak
 * without losing the design-system baseline.
 */

import { Menu, MenuItem, type MenuProps, type MenuItemProps } from '@mui/material';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

const DEFAULT_PAPER_SX = {
  bgcolor: COLORS.bg.white,
  color: COLORS.text.strong,
  border: `1px solid ${COLORS.border.light}`,
  borderRadius: RADII.md,
  boxShadow: SHADOWS.popover,
  mt: 1,
  minWidth: 200,
  '& .MuiMenuItem-root': {
    color: COLORS.text.strong,
    fontSize: '0.875rem', // 14px floor
    py: 1,
    '&:hover': {
      bgcolor: COLORS.brand.primaryWash,
    },
    '&.Mui-selected': {
      bgcolor: COLORS.brand.primarySubtle,
      '&:hover': {
        bgcolor: COLORS.brand.primarySubtle,
      },
    },
  },
  '& .MuiListItemIcon-root': {
    color: COLORS.text.muted,
    minWidth: 32,
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.875rem',
    color: COLORS.text.strong,
  },
} as const;

export function PheraMenu({ PaperProps, MenuListProps, ...rest }: MenuProps) {
  const userPaperSx = (PaperProps as any)?.sx;
  return (
    <Menu
      {...rest}
      PaperProps={{
        elevation: 0,
        ...PaperProps,
        sx: { ...DEFAULT_PAPER_SX, ...userPaperSx },
      }}
      MenuListProps={{
        dense: false,
        ...MenuListProps,
      }}
    />
  );
}

/**
 * Re-export of MUI's MenuItem. Exists so callers only need one import
 * (`@/components/shared/Menu`) instead of reaching back into MUI for
 * the item. Styling comes from the parent PheraMenu.
 */
export function PheraMenuItem(props: MenuItemProps) {
  return <MenuItem {...props} />;
}

export default PheraMenu;
