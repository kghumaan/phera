import { Switch, type SwitchProps } from 'react-native';

import { COLORS } from '@/lib/theme/tokens';

/**
 * Port of web `PheraSwitch`: off = neutral track, on = brand pink track.
 * Baked in — don't override per-callsite.
 */
export function PheraSwitch(props: SwitchProps) {
  return (
    <Switch
      trackColor={{ false: 'rgba(0, 0, 0, 0.15)', true: COLORS.brand.primary }}
      thumbColor={COLORS.bg.white}
      ios_backgroundColor="rgba(0, 0, 0, 0.15)"
      {...props}
    />
  );
}
