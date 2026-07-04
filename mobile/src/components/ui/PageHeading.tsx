import type { ReactNode } from 'react';
import { View } from 'react-native';

import { PheraText } from './PheraText';

export interface PageHeadingProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action (e.g. an icon button). */
  action?: ReactNode;
}

/** Port of web `PageHeading` — the h6 + body2 pair every admin page opens with. */
export function PageHeading({ title, subtitle, action }: PageHeadingProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <PheraText variant="h1">{title}</PheraText>
        {subtitle ? <PheraText variant="body2">{subtitle}</PheraText> : null}
      </View>
      {action}
    </View>
  );
}

/** Port of web `SectionHeading`. */
export function SectionHeading({ title, subtitle, action }: PageHeadingProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <PheraText variant="h2">{title}</PheraText>
        {subtitle ? <PheraText variant="body2">{subtitle}</PheraText> : null}
      </View>
      {action}
    </View>
  );
}
