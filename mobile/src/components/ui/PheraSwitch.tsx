import { Switch, type SwitchProps } from 'react-native';

import { COLORS } from '@/lib/theme/tokens';

/**
 * Port of web `PheraSwitch`: off = neutral track, on = brand pink track.
 * Baked in — don't override per-callsite.
 */
export function PheraSwitch(props: SwitchProps) {
  return (
    <Switch
      trackColor={{ false: COLORS.border.default, true: COLORS.brand.primary }}
      thumbColor={COLORS.bg.white}
      ios_backgroundColor={COLORS.border.default}
      {...props}
    />
  );
}
